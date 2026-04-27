import React from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import { useChat } from '../../hooks/useChat';

export default function ChatLayout() {
  const chatContext = useChat();
  const { activeChat, setActiveChat, loading, error } = chatContext;

  return (
    <div className="flex h-[calc(100vh-80px)] w-full rounded-2xl overflow-hidden border border-border-main glass-panel shadow-lg">
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-1/3 border-r border-border-main bg-bg-secondary bg-opacity-70 backdrop-blur-md flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatList chatContext={chatContext} />
      </div>

      {/* Main Area: Chat Window */}
      <div className={`flex-1 flex flex-col bg-bg-main bg-opacity-50 backdrop-blur-sm ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <ChatWindow chatContext={chatContext} onBack={() => setActiveChat(null)} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-6 text-center">
            <div className="w-20 h-20 mb-6 rounded-full bg-bg-secondary flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-accent opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-text-main">Tus Mensajes</h3>
            <p className="text-sm mt-2 max-w-md text-center">Selecciona una conversación o inicia un nuevo chat con los miembros de tu negocio.</p>
          </div>
        )}
      </div>
    </div>
  );
}
