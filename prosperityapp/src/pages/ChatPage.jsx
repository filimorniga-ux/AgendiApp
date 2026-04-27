import React from 'react';
import ChatLayout from '../components/chat/ChatLayout';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-60px)] md:h-screen flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-accent" />
            Chat Interno
          </h1>
          <p className="text-sm text-text-muted mt-1">Comunícate con tu equipo en tiempo real</p>
        </div>
      </div>
      
      <div className="flex-1">
        <ChatLayout />
      </div>
    </div>
  );
}
