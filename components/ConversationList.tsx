import React, { useState } from 'react';
import { Search, Filter, MessageSquare, Phone, Mail } from 'lucide-react';
import { Conversation } from '../types';
import { formatPhone } from '../utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ conversations, activeId, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'waiting'>('all');

  const filtered = conversations.filter(c => {
    const matchesSearch = c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.contactPhone.includes(searchTerm);
    const matchesFilter = filter === 'all' ? true : c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getIcon = (platform: string) => {
    switch(platform) {
      case 'whatsapp': return <MessageSquare size={14} className="text-green-500" />;
      case 'instagram': return <MessageSquare size={14} className="text-pink-500" />;
      default: return <Mail size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="w-80 border-r border-gray-800 bg-[#0A0C14] flex flex-col h-full">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4 font-heading">Atendimentos</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            className="w-full bg-[#1E2028] border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:border-af-blue focus:ring-1 focus:ring-af-blue"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
            <button 
                onClick={() => setFilter('all')}
                className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors ${filter === 'all' ? 'bg-af-blue text-white' : 'bg-[#1E2028] text-gray-400 hover:text-white'}`}
            >
                Todos
            </button>
            <button 
                onClick={() => setFilter('active')}
                className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors ${filter === 'active' ? 'bg-af-blue text-white' : 'bg-[#1E2028] text-gray-400 hover:text-white'}`}
            >
                Ativos
            </button>
            <button 
                onClick={() => setFilter('waiting')}
                className={`flex-1 text-xs font-bold py-1.5 rounded transition-colors ${filter === 'waiting' ? 'bg-af-blue text-white' : 'bg-[#1E2028] text-gray-400 hover:text-white'}`}
            >
                Fila
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv) => {
          // Normaliza para comparar apenas números (evita que "+55..." seja diferente de "55...")
          const nameDigits = conv.contactName.replace(/\D/g, '');
          const phoneDigits = conv.contactPhone.replace(/\D/g, '');
          const showSubLabel = nameDigits !== phoneDigits;

          return (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`p-4 border-b border-gray-800 cursor-pointer transition-all hover:bg-white/5 relative group ${
                activeId === conv.id ? 'bg-af-blue/10 border-l-4 border-l-af-blue' : 'border-l-4 border-l-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex flex-col min-w-0 pr-2">
                  <span className={`font-bold text-sm truncate ${activeId === conv.id ? 'text-white' : 'text-af-gray-100 group-hover:text-white'}`}>
                    {conv.contactName}
                  </span>
                  
                  {showSubLabel && (
                    <span className={`text-[10px] font-mono -mt-0.5 ${activeId === conv.id ? 'text-blue-200' : 'text-gray-500'}`}>
                      {formatPhone(conv.contactPhone)}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 whitespace-nowrap">
                  {conv.lastMessageTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              
              <p className="text-xs text-gray-400 truncate mb-2 pr-4 mt-1">
                {conv.messages[conv.messages.length - 1]?.senderId === 'agent' && <span className="text-af-blue mr-1">Você:</span>}
                {conv.lastMessage}
              </p>

              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <div className="bg-[#1E2028] p-1 rounded">
                          {getIcon(conv.platform)}
                      </div>
                      {conv.tags.slice(0, 1).map(tag => (
                          <span key={tag} className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                              {tag}
                          </span>
                      ))}
                  </div>
                  {conv.unreadCount > 0 && (
                      <span className="bg-af-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {conv.unreadCount}
                      </span>
                  )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};