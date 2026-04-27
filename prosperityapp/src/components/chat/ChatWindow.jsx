import React, { useRef, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Phone, Video } from 'lucide-react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ChatWindow({ chatContext, onBack }) {
  const { activeChat, messages, sendMessage, currentUser, getCollaboratorInfo } = chatContext;
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content) => {
    sendMessage(content);
  };

  if (!activeChat) return null;

  // Obtener info visual del chat activo
  const getChatVisuals = () => {
    if (activeChat.is_group) {
      return {
        name: activeChat.name || 'Grupo Sin Nombre',
        initials: (activeChat.name || 'G').substring(0, 2).toUpperCase()
      };
    }
    
    // Chat 1:1
    const otherMember = activeChat.chat_members?.find(m => m.user_id !== currentUser?.id);
    if (otherMember) {
      const info = getCollaboratorInfo(otherMember.user_id);
      return {
        name: info.name,
        initials: info.initials || '?'
      };
    }
    
    return { name: 'Chat', initials: '?' };
  };

  const visuals = getChatVisuals();

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-border-main flex items-center justify-between bg-bg-secondary bg-opacity-80 backdrop-blur-md z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-accent bg-opacity-20 flex items-center justify-center text-accent font-bold">
              {visuals.initials}
            </div>
            {/* Indicador de estado (por ahora quemado en verde para UI) */}
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-bg-secondary"></div>
          </div>
          
          <div>
            <h2 className="text-base font-bold text-text-main leading-tight">{visuals.name}</h2>
            <p className="text-xs text-text-muted">En línea</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-secondary hidden sm:block">
            <Video className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-secondary hidden sm:block">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-secondary">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area - with pattern background */}
      <div 
        className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-border-main"
        style={{
          backgroundImage: 'radial-gradient(var(--color-border-main) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-full">
          {/* Aquí podríamos agregar separadores de fecha reales agrupando los mensajes */}
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-muted mb-6">
              <p className="bg-bg-tertiary px-4 py-2 rounded-full shadow-sm border border-border-main text-sm">
                Esta conversación está vacía.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwnMessage={msg.sender_id === currentUser?.id} 
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}
