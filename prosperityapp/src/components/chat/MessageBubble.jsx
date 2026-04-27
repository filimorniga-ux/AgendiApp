import React from 'react';
import { Check, CheckCheck } from 'lucide-react';

export default function MessageBubble({ message, isOwnMessage }) {
  // Mock timestamp formatting
  const timeString = new Date(message.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex w-full mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[75%] md:max-w-[65%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Name for group chats if needed, omitted for now */}
        
        <div 
          className={`relative px-4 py-2 rounded-2xl shadow-sm text-sm 
            ${isOwnMessage 
              ? 'bg-accent text-accent-text rounded-tr-none' 
              : 'bg-bg-secondary text-text-main border border-border-main rounded-tl-none'
            }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          
          <div className={`flex items-center justify-end gap-1 mt-1 -mb-1 ${isOwnMessage ? 'text-accent-text opacity-80' : 'text-text-muted'} text-[10px]`}>
            <span>{timeString}</span>
            {isOwnMessage && (
              <span className="ml-1">
                {message.is_read ? (
                  <CheckCheck className="w-3 h-3 text-blue-300" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>
          
          {/* WhatsApp-style tail indicator */}
          <div 
            className={`absolute top-0 w-3 h-4 
              ${isOwnMessage 
                ? '-right-2 bg-accent clip-bubble-right' 
                : '-left-2 bg-bg-secondary border-l border-t border-border-main clip-bubble-left'
              }`}
            style={{
              clipPath: isOwnMessage 
                ? 'polygon(0 0, 100% 0, 0 100%)' 
                : 'polygon(100% 0, 0 0, 100% 100%)'
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
