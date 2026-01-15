import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, MoreVertical, Smile, Check, CheckCheck, Clock } from 'lucide-react';
import { Conversation, Message } from '../types';
import { formatPhone } from '../utils';

interface ChatWindowProps {
  conversation: Conversation;
  onSendMessage: (text: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#05060A] relative">
      {/* Background Pattern - Subtle Race Track / Technical Lines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(45deg, #1440FF 1px, transparent 1px), linear-gradient(-45deg, #1440FF 1px, transparent 1px)', 
             backgroundSize: '40px 40px' 
           }} 
      />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-af-black border-b border-gray-800 shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <div className="relative">
             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold border border-gray-600">
                {conversation.contactName.substring(0, 2).toUpperCase()}
             </div>
             <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-af-black"></span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-heading">{conversation.contactName}</h2>
            <div className="flex items-center gap-2">
                <span className="text-sm text-af-gray-200">{formatPhone(conversation.contactPhone)}</span>
                {conversation.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-af-blue/20 text-af-blue font-bold border border-af-blue/30 uppercase">
                        {tag}
                    </span>
                ))}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="p-2 text-af-gray-200 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
        {conversation.messages.map((msg) => {
          const isAgent = msg.senderId === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-md relative group ${
                  isAgent
                    ? 'bg-af-blue text-white rounded-tr-none' // Agent: AutoForce Blue
                    : 'bg-[#1E2028] text-white border border-gray-700 rounded-tl-none' // Customer: Dark Gray
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                
                <div className={`flex items-center justify-end mt-1 space-x-1 ${isAgent ? 'text-blue-200' : 'text-gray-400'}`}>
                  <span className="text-[10px]">{formatTime(new Date(msg.timestamp))}</span>
                  {isAgent && (
                    <span>
                      {msg.status === 'read' ? <CheckCheck size={12} /> : 
                       msg.status === 'delivered' ? <CheckCheck size={12} className="opacity-50" /> :
                       <Check size={12} />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-af-black border-t border-gray-800 z-10">
        <form onSubmit={handleSend} className="flex items-end gap-3 max-w-4xl mx-auto">
          <button type="button" className="p-3 text-af-gray-200 hover:text-af-blue transition-colors">
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 bg-[#1E2028] rounded-xl border border-gray-700 focus-within:border-af-blue focus-within:ring-1 focus-within:ring-af-blue transition-all flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-500 py-3 px-4"
            />
            <button type="button" className="p-3 text-af-gray-200 hover:text-yellow-400 transition-colors">
              <Smile size={20} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 bg-af-blue hover:bg-af-blue-dark text-white rounded-xl shadow-lg shadow-af-blue/30 transition-all disabled:opacity-50 disabled:shadow-none transform active:scale-95"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="text-center mt-2">
            <span className="text-[10px] text-af-gray-300 uppercase tracking-widest">
                Powered by AutoForce & n8n
            </span>
        </div>
      </div>
    </div>
  );
};