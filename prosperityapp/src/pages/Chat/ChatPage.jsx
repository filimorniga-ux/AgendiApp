import React, { useState, useEffect, useRef } from 'react';
import { useBusiness } from '../../context/BusinessContext';
import { supabase } from '../../supabase/client';
import feather from 'feather-icons';
import toast from 'react-hot-toast';

const Icon = ({ name, className = '' }) => {
  const icon = feather.icons[name];
  if (!icon) return null;
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      dangerouslySetInnerHTML={{ __html: icon.toSvg({ class: 'w-full h-full' }) }}
    />
  );
};

const ChatPage = () => {
  const { businessId } = useBusiness();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Load conversations
  useEffect(() => {
    if (!businessId) return;

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('business_id', businessId)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations', error);
      } else {
        setConversations(data || []);
      }
      setLoading(false);
    };

    fetchConversations();

    const convSub = supabase
      .channel('public:whatsapp_conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations', filter: `business_id=eq.${businessId}` }, payload => {
        // Handle changes
        if (payload.eventType === 'INSERT') {
          setConversations(prev => [payload.new, ...prev].sort((a,b) => new Date(b.last_message_at) - new Date(a.last_message_at)));
        } else if (payload.eventType === 'UPDATE') {
          setConversations(prev => prev.map(c => c.id === payload.new.id ? payload.new : c).sort((a,b) => new Date(b.last_message_at) - new Date(a.last_message_at)));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(convSub);
    };
  }, [businessId]);

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', activeConvId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages', error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    const msgSub = supabase
      .channel(`public:whatsapp_messages:${activeConvId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `conversation_id=eq.${activeConvId}` }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
    };
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Removed feather.replace() to prevent React unmount crashes

  const activeConversation = conversations.find(c => c.id === activeConvId);

  const handleToggleStatus = async () => {
    if (!activeConversation) return;
    const newStatus = activeConversation.status === 'bot_active' ? 'human_active' : 'bot_active';
    
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ status: newStatus })
      .eq('id', activeConversation.id);

    if (error) {
      toast.error('Error actualizando estado de la conversación');
      console.error(error);
    } else {
      toast.success(newStatus === 'human_active' ? 'Atención manual activada' : 'Bot AI reactivado');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;
    
    if (activeConversation?.status === 'bot_active') {
      toast.error('Debes tomar el control para enviar mensajes (Cambiar a Atención Manual)');
      return;
    }

    const newMsg = {
      conversation_id: activeConvId,
      sender_type: 'human',
      content: inputText.trim(),
      message_type: 'text'
    };

    setInputText('');

    const { error } = await supabase
      .from('whatsapp_messages')
      .insert([newMsg]);

    if (error) {
      toast.error('Error enviando mensaje');
      console.error(error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-bg-main overflow-hidden relative">
      {/* Sidebar de conversaciones */}
      <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-border-main flex flex-col bg-bg-secondary ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border-main flex justify-between items-center bg-bg-secondary sticky top-0 z-10">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <Icon name="message-circle" className="text-accent w-5 h-5" />
            Chat AI
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-text-muted">Cargando conversaciones...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-text-muted">No hay conversaciones activas.</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-4 border-b border-border-main/50 transition-colors hover:bg-bg-tertiary ${activeConvId === conv.id ? 'bg-bg-tertiary border-l-4 border-l-accent' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-text-main truncate pr-2">
                    {conv.customer_name || conv.customer_phone}
                  </span>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted truncate pr-2">
                    {conv.customer_phone}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${conv.status === 'bot_active' ? 'bg-blue-500/20 text-blue-400' : 'bg-accent/20 text-accent'}`}>
                    {conv.status === 'bot_active' ? 'Bot' : 'Humano'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Área de chat */}
      <div className={`flex-1 flex flex-col h-full bg-bg-main relative ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Cabecera del chat */}
            <div className="p-4 border-b border-border-main bg-bg-secondary flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button 
                  className="md:hidden text-text-muted hover:text-text-main p-1"
                  onClick={() => setActiveConvId(null)}
                >
                  <Icon name="arrow-left" className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-main font-bold border border-border-main">
                  {(activeConversation.customer_name || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-text-main leading-tight">
                    {activeConversation.customer_name || activeConversation.customer_phone}
                  </h3>
                  <span className="text-xs text-text-muted">
                    {activeConversation.customer_phone}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {activeConversation.status === 'bot_active' ? (
                  <button 
                    onClick={handleToggleStatus}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-colors text-sm font-semibold"
                    title="Tomar el control de la conversación"
                  >
                    <Icon name="user" className="w-4 h-4" />
                    Tomar control
                  </button>
                ) : (
                  <button 
                    onClick={handleToggleStatus}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors text-sm font-semibold"
                    title="Devolver control al Bot AI"
                  >
                    <Icon name="cpu" className="w-4 h-4" />
                    Activar Bot
                  </button>
                )}
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundImage: 'linear-gradient(to bottom, var(--color-bg-main) 0%, var(--color-bg-tertiary) 100%)', opacity: 0.95 }}>
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-text-muted">
                  No hay mensajes en esta conversación.
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isCustomer = msg.sender_type === 'customer';
                  const isBot = msg.sender_type === 'bot';
                  
                  return (
                    <div key={msg.id || i} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                        isCustomer 
                          ? 'bg-bg-secondary border border-border-main text-text-main rounded-tl-none' 
                          : isBot
                            ? 'bg-blue-900/40 border border-blue-800/50 text-white rounded-tr-none'
                            : 'bg-accent border border-accent/80 text-accent-text rounded-tr-none'
                      }`}>
                        <p className="whitespace-pre-wrap break-words text-sm">{msg.content}</p>
                        <div className={`flex items-center justify-end mt-1 gap-1 text-[10px] ${
                          isCustomer ? 'text-text-muted' : (isBot ? 'text-blue-200' : 'text-accent-text/80')
                        }`}>
                          {!isCustomer && (
                            <Icon name={isBot ? "cpu" : "user"} className="w-3 h-3" />
                          )}
                          <span>{formatTime(msg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <div className="p-3 bg-bg-secondary border-t border-border-main">
              {activeConversation.status === 'bot_active' ? (
                <div className="text-center p-2 text-sm text-text-muted bg-bg-tertiary rounded-lg border border-border-main/50 flex flex-col items-center gap-1">
                  <Icon name="cpu" className="w-4 h-4 text-blue-400" />
                  <span>El Bot AI está respondiendo. Para enviar mensajes debes tomar el control.</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-bg-tertiary border border-border-main rounded-lg p-3 text-text-main focus:border-accent focus:outline-none resize-none min-h-[44px] max-h-32"
                    rows="1"
                  />
                  <button 
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-3 rounded-lg bg-accent text-accent-text hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Icon name="send" className="w-5 h-5" />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-text-muted p-6">
            <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center mb-4 border border-border-main/50 shadow-inner">
              <Icon name="message-square" className="w-10 h-10 text-accent/50" />
            </div>
            <p className="text-lg font-medium text-text-main mb-2">Chat Inteligente</p>
            <p className="text-center max-w-sm">Selecciona una conversación del panel lateral para ver los mensajes o tomar el control.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
