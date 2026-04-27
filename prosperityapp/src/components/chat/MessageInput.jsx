import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

export default function MessageInput({ onSendMessage }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 bg-bg-secondary bg-opacity-80 backdrop-blur-md border-t border-border-main z-10">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Attachment button (mock) */}
        <button 
          type="button"
          className="p-2.5 rounded-full hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-main flex-shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Input area */}
        <div className="flex-1 relative bg-bg-tertiary rounded-2xl border border-border-main flex items-end shadow-sm">
          <button 
            type="button"
            className="p-2.5 ml-1 text-text-muted hover:text-text-main transition-colors flex-shrink-0"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="flex-1 max-h-[120px] py-3 px-2 bg-transparent border-none focus:outline-none resize-none text-text-main text-sm scrollbar-thin scrollbar-thumb-border-main"
            rows="1"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className={`p-3 rounded-full flex-shrink-0 transition-all shadow-md
            ${message.trim() 
              ? 'bg-accent text-accent-text hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 transform' 
              : 'bg-bg-tertiary text-text-muted opacity-50 cursor-not-allowed'
            }`}
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}
