import React, { useRef, useEffect } from 'react';
import { MoreVertical, Check, CheckCheck } from 'lucide-react';
import { Conversation } from '../types';
import { formatPhone, parseWhatsAppTemplateMessage } from '../utils';
import { MenuTemplate, WhatsAppTemplateMessage } from './MessageTemplates';

interface ChatWindowProps {
  conversation: Conversation;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversation }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation.messages]);

  const formatTime = (dateValue: Date | string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '--:--';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMenuMessage = (text: string) => text.trim().toLowerCase() === 'menu';

  const safeContactName = conversation.contactName || 'Desconhecido';

  const renderMessageMeta = (isAgent: boolean, status: string, timestamp: Date | string) => (
    <div className={`flex items-center justify-end mt-1 space-x-1 ${isAgent ? 'text-blue-200' : 'text-gray-400'}`}>
      <span className="text-[10px]">{formatTime(timestamp)}</span>
      {isAgent && (
        <span>
          {status === 'read' ? <CheckCheck size={12} /> :
            status === 'delivered' ? <CheckCheck size={12} className="opacity-50" /> :
              <Check size={12} />}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#05060A] relative">
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(45deg, #1440FF 1px, transparent 1px), linear-gradient(-45deg, #1440FF 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="flex items-center justify-between px-6 py-4 bg-af-black border-b border-gray-800 shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold border border-gray-600">
              {safeContactName.substring(0, 2).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-af-black"></span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-heading">{safeContactName}</h2>
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

      <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10">
        {conversation.messages.map((msg) => {
          const isAgent = msg.senderId === 'agent';
          const isMenu = isMenuMessage(msg.text);
          const templateData = parseWhatsAppTemplateMessage(msg.text, safeContactName);

          return (
            <div
              key={msg.id}
              className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
            >
              {isMenu ? (
                <div className="relative group">
                  <MenuTemplate isAgent={isAgent} />
                  {renderMessageMeta(isAgent, msg.status, msg.timestamp)}
                </div>
              ) : templateData ? (
                <div className="relative group">
                  <WhatsAppTemplateMessage isAgent={isAgent} template={templateData} />
                  {renderMessageMeta(isAgent, msg.status, msg.timestamp)}
                </div>
              ) : (
                <div
                  className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-md relative group ${
                    isAgent
                      ? 'bg-af-blue text-white rounded-tr-none'
                      : 'bg-[#1E2028] text-white border border-gray-700 rounded-tl-none'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {renderMessageMeta(isAgent, msg.status, msg.timestamp)}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

    </div>
  );
};
