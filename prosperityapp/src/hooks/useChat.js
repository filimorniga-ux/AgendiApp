import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';

import { useBusiness } from '../context/BusinessContext';

export function useChat() {
  const { supabaseUser: user } = useBusiness();
  const { businessId } = useBusiness();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use refs for stable values inside the realtime subscription to avoid memory leaks
  // and constant re-subscriptions when these states change.
  const activeChatRef = useRef(activeChat);
  const userRef = useRef(user);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 1. Fetch Collaborators (to map user_id -> name/avatar)
  useEffect(() => {
    if (!businessId) return;
    
    const fetchCollaborators = async () => {
      const { data, error } = await supabase
        .from('collaborators')
        .select('auth_user_id, name, last_name, app_role')
        .eq('business_id', businessId)
        .eq('status', 'active');
        
      if (!error && data) {
        setCollaborators(data);
      }
    };
    
    fetchCollaborators();
  }, [businessId]);

  // 2. Fetch User's Chats
  const fetchChats = useCallback(async () => {
    if (!user?.id || !businessId) return;
    
    try {
      setLoading(true);
      // We first need the chats where the user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('chat_members')
        .select('chat_id')
        .eq('user_id', user.id);
        
      if (memberError) throw memberError;
      
      const chatIds = memberData.map(m => m.chat_id);
      
      if (chatIds.length === 0) {
        setChats([]);
        return;
      }
      
      // Then fetch those chats along with all their members and the last message
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          id, is_group, name, updated_at,
          chat_members(user_id),
          messages(id, content, created_at, sender_id, is_read)
        `)
        .eq('business_id', businessId)
        .in('id', chatIds)
        .order('updated_at', { ascending: false });
        
      if (chatsError) throw chatsError;
      
      // Map the messages to just get the latest one
      const formattedChats = chatsData.map(chat => {
        // Fix: Do not mutate the original array, create a shallow copy before sorting
        const sortedMessages = chat.messages ? [...chat.messages].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [];
        const lastMessage = sortedMessages.length > 0 ? sortedMessages[0] : null;
        
        return {
          ...chat,
          lastMessage
        };
      });
      
      setChats(formattedChats);
    } catch (err) {
      console.error('Error fetching chats:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, businessId]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // 3. Fetch Messages for Active Chat
  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId || !user?.id) {
      setMessages([]);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data || []);
      
      // Mark as read if not sent by me
      const unreadIds = data
        .filter(m => m.sender_id !== user.id && !m.is_read)
        .map(m => m.id);
        
      if (unreadIds.length > 0) {
        // Use the RPC to safely mark messages as read
        await supabase.rpc('mark_messages_as_read', { p_message_ids: unreadIds });

        // Update local chats state so the unread indicator clears
        setChats(prev => prev.map(c => {
          if (c.id === chatId && c.lastMessage && unreadIds.includes(c.lastMessage.id)) {
             return { ...c, lastMessage: { ...c.lastMessage, is_read: true }};
          }
          return c;
        }));
      }
      
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.id);
    }
  }, [activeChat, fetchMessages]);

  // 4. Supabase Realtime Subscription
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const { eventType, new: newRecord } = payload;
          const currentActiveChat = activeChatRef.current;
          const currentUser = userRef.current;

          if (eventType === 'INSERT') {
            // Deduplicate: If we already have this message (via optimistic update), ignore or update it
            setMessages(prev => {
              if (currentActiveChat && newRecord.chat_id === currentActiveChat.id) {
                const exists = prev.some(m => m.id === newRecord.id);
                if (exists) {
                  return prev.map(m => m.id === newRecord.id ? newRecord : m);
                }
                return [...prev, newRecord];
              }
              return prev;
            });
            
            // Mark as read if it's for the open chat and not sent by me
            if (currentActiveChat && newRecord.chat_id === currentActiveChat.id && newRecord.sender_id !== currentUser?.id) {
              supabase.rpc('mark_messages_as_read', { p_message_ids: [newRecord.id] }).then(() => {
                // Also update local unread state
                setChats(prevChats => prevChats.map(c => {
                  if (c.id === currentActiveChat.id && c.lastMessage?.id === newRecord.id) {
                    return { ...c, lastMessage: { ...c.lastMessage, is_read: true } };
                  }
                  return c;
                }));
              });
            }
            
            // Update the chats list with the new message
            setChats(prevChats => {
              const chatExists = prevChats.some(c => c.id === newRecord.chat_id);
              if (!chatExists) {
                // If it's a new chat we don't have, we should probably fetch it,
                // but doing it directly here might be an anti-pattern.
                // Using a flag to trigger fetch outside the state updater is better.
                setTimeout(fetchChats, 0);
                return prevChats;
              }

              const updatedChats = prevChats.map(c => {
                if (c.id === newRecord.chat_id) {
                  return { ...c, lastMessage: newRecord, updated_at: newRecord.created_at };
                }
                return c;
              });

              // Fix mutation bug
              return updatedChats.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            });
          } else if (eventType === 'UPDATE') {
             // Handle read receipts
             setMessages(prev => prev.map(m => m.id === newRecord.id ? newRecord : m));

             setChats(prevChats => prevChats.map(c => {
                if (c.id === newRecord.chat_id && c.lastMessage?.id === newRecord.id) {
                  return { ...c, lastMessage: newRecord };
                }
                return c;
             }));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  // Intentionally omitting activeChat and fetchChats from deps to prevent re-subscriptions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // 5. Send Message
  const sendMessage = async (content) => {
    if (!activeChat || !user?.id || !content.trim()) return;
    
    // Generate a secure UUID locally so we can insert it and know its ID immediately
    const messageId = crypto.randomUUID();

    const tempMessage = {
      id: messageId, // Use real UUID for deduplication
      chat_id: activeChat.id,
      sender_id: user.id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      is_read: false,
      status: 'sending' // Custom UI status
    };
    
    // Optimistic update
    setMessages(prev => [...prev, tempMessage]);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          id: messageId, // Send the explicit UUID
          chat_id: activeChat.id,
          sender_id: user.id,
          content: content.trim()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // The realtime subscription UPDATE/INSERT might beat this,
      // but if it doesn't, we update the status locally.
      setMessages(prev => prev.map(m => m.id === messageId ? data : m));
      
      // Also update the `chats` table `updated_at` to trigger sorting for other users
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeChat.id);
        
    } catch (err) {
      console.error('Error sending message:', err);
      // Revert optimistic update on failure, or mark as failed
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: 'error' } : m));
    }
  };
  
  // 6. Create or Get Chat (1:1)
  const createOrGetDirectChat = async (targetUserId) => {
    if (!user?.id || !businessId) return;
    
    // First check if a 1:1 chat already exists with this user
    const existingChat = chats.find(c => 
      !c.is_group && 
      c.chat_members?.some(m => m.user_id === targetUserId) &&
      c.chat_members?.some(m => m.user_id === user.id)
    );
    
    if (existingChat) {
      setActiveChat(existingChat);
      return existingChat;
    }
    
    // If not, create a new one
    try {
      const chatId = crypto.randomUUID();
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          id: chatId, // Explicit UUID
          business_id: businessId,
          is_group: false
        })
        .select()
        .single();
        
      if (chatError) throw chatError;
      
      // Add both members
      const members = [
        { chat_id: chatData.id, user_id: user.id },
        { chat_id: chatData.id, user_id: targetUserId }
      ];
      
      const { error: membersError } = await supabase
        .from('chat_members')
        .insert(members);
        
      if (membersError) throw membersError;
      
      await fetchChats(); // Refresh the list
      return chatData;
    } catch (err) {
      console.error('Error creating chat:', err);
      return null;
    }
  };

  // Helper to resolve user name from collaborators
  const getCollaboratorInfo = (userId) => {
    const col = collaborators.find(c => c.auth_user_id === userId);
    if (col) {
      return {
        name: `${col.name} ${col.last_name || ''}`.trim(),
        initials: `${col.name?.[0] || ''}${col.last_name?.[0] || ''}`.toUpperCase(),
        role: col.app_role
      };
    }
    return { name: 'Usuario Desconocido', initials: '?' };
  };

  return {
    chats,
    activeChat,
    setActiveChat,
    messages,
    sendMessage,
    loading,
    error,
    getCollaboratorInfo,
    collaborators,
    createOrGetDirectChat,
    currentUser: user
  };
}
