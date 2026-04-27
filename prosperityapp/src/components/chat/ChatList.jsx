import React, { useState } from 'react';
import { Search, Plus, MessageCircle } from 'lucide-react';

export default function ChatList({ chatContext }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { chats, activeChat, setActiveChat, getCollaboratorInfo, currentUser, loading } = chatContext;

  // Formatear la fecha del último mensaje
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).getDate() === date.getDate();
    if (isYesterday) {
      return 'Ayer';
    }
    
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  // Obtener info visual del chat (nombre, iniciales, etc)
  const getChatVisuals = (chat) => {
    if (chat.is_group) {
      return {
        name: chat.name || 'Grupo Sin Nombre',
        initials: (chat.name || 'G').substring(0, 2).toUpperCase()
      };
    }
    
    // Chat 1:1 -> Buscar al otro participante
    const otherMember = chat.chat_members?.find(m => m.user_id !== currentUser?.id);
    if (otherMember) {
      const info = getCollaboratorInfo(otherMember.user_id);
      return {
        name: info.name,
        initials: info.initials || '?'
      };
    }
    
    return { name: 'Chat', initials: '?' };
  };

  // Filtrar chats por búsqueda
  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const visuals = getChatVisuals(chat);
    return visuals.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border-main flex items-center justify-between bg-bg-secondary bg-opacity-80 backdrop-blur-md z-10">
        <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-accent" />
          Chats
        </h2>
        <button className="p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-secondary hover:text-accent">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-border-main bg-bg-main bg-opacity-50">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar o empezar chat..."
            className="w-full bg-bg-tertiary text-text-main border border-border-input rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-accent text-sm transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
        </div>
      </div>

      {/* Chat Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border-main hover:scrollbar-thumb-text-muted">
        {loading && chats.length === 0 ? (
          <div className="flex justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            const visuals = getChatVisuals(chat);
            // Calculamos unread basándonos en si el último mensaje no es nuestro y no está leído
            const hasUnread = chat.lastMessage && 
                              chat.lastMessage.sender_id !== currentUser?.id && 
                              !chat.lastMessage.is_read;

            return (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`flex items-center gap-3 p-3 cursor-pointer border-b border-border-main transition-colors ${activeChat?.id === chat.id ? 'bg-bg-tertiary border-l-4 border-l-accent' : 'hover:bg-bg-main border-l-4 border-l-transparent'}`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-accent bg-opacity-20 flex items-center justify-center text-accent font-bold shadow-sm">
                    {visuals.initials}
                  </div>
                  {hasUnread && (
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-accent border-2 border-bg-secondary"></div>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-sm font-semibold text-text-main truncate pr-2">{visuals.name}</h3>
                    <span className={`text-xs flex-shrink-0 ${hasUnread ? 'text-accent font-medium' : 'text-text-muted'}`}>
                      {formatTime(chat.lastMessage?.created_at || chat.updated_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className={`text-xs truncate ${hasUnread ? 'text-text-main font-medium' : 'text-text-muted'}`}>
                      {chat.lastMessage?.content || 'Empieza una conversación'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-text-muted p-6 text-center">
            <p className="text-sm">{searchQuery ? 'No se encontraron resultados' : 'Aún no tienes chats'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
