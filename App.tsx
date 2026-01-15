import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { Settings } from './components/Settings';
import { MOCK_CONVERSATIONS, DEFAULT_SUPABASE_CONFIG } from './constants';
import { Conversation, ViewState, Message, SystemConfig } from './types';
import { realtimeService } from './services/socket';
import { formatPhone } from './utils';

// Chave para salvar no localStorage
const STORAGE_KEY = 'autoforce_monitor_config';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('live-chat');
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // Estado das configurações
  const [config, setConfig] = useState<SystemConfig>({ supabaseUrl: '', supabaseKey: '' });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Helper para ordenar mensagens com alta precisão e desempate por ID
  const sortMessages = (msgs: Message[]) => {
      return msgs.sort((a, b) => {
        // 1. Comparação por Timestamp (Numérico)
        const timeA = a.createdAtRaw ? new Date(a.createdAtRaw).getTime() : new Date(a.timestamp).getTime();
        const timeB = b.createdAtRaw ? new Date(b.createdAtRaw).getTime() : new Date(b.timestamp).getTime();
        
        if (timeA !== timeB) {
            return timeA - timeB;
        }

        // 2. Critério de Desempate: ID (Assumindo que IDs maiores = mensagens mais novas)
        // O localeCompare com { numeric: true } trata strings como "10" e "2" corretamente (10 > 2)
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });
  };

  // 1. Carregar configurações ao iniciar
  useEffect(() => {
    const initSystem = async (url: string, key: string) => {
        setConfig({ supabaseUrl: url, supabaseKey: key });
        setIsConfigured(true);
        realtimeService.initialize(url, key);
        
        // Carrega Histórico
        await loadHistory();
    };

    const savedConfig = localStorage.getItem(STORAGE_KEY);
    
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.supabaseUrl && parsed.supabaseKey) {
        initSystem(parsed.supabaseUrl, parsed.supabaseKey);
        return;
      }
    }

    // Fallback para Config Padrão (Credenciais fornecidas)
    if (DEFAULT_SUPABASE_CONFIG.supabaseUrl && DEFAULT_SUPABASE_CONFIG.supabaseKey) {
        initSystem(DEFAULT_SUPABASE_CONFIG.supabaseUrl, DEFAULT_SUPABASE_CONFIG.supabaseKey);
    } else {
        setCurrentView('settings');
    }
  }, []);

  // Função para carregar e processar histórico
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    const history = await realtimeService.fetchHistory();
    
    if (history && history.length > 0) {
        const conversationsMap = new Map<string, Conversation>();

        history.forEach(msg => {
            const phone = msg.phone;
            if (!phone) return;
            const cleanPhone = phone.replace(/\D/g, '');

            const appMsg: Message = {
                id: msg.id ? String(msg.id) : `temp-${Date.now()}-${Math.random()}`, // Garante ID string
                text: msg.content || '',
                senderId: msg.direction === 'outbound' ? 'agent' : 'customer',
                timestamp: new Date(msg.created_at),
                createdAtRaw: msg.created_at, // Importante: Salva o raw
                status: msg.status || 'delivered',
                type: msg.type || 'text'
            };

            // Tenta encontrar o nome em várias colunas possíveis
            const dbName = msg.contact_name || msg.name || msg.push_name || msg.sender_name;
            // Se não tiver nome, usa o telefone formatado como nome de exibição
            const displayName = dbName || formatPhone(phone);

            if (!conversationsMap.has(cleanPhone)) {
                conversationsMap.set(cleanPhone, {
                    id: phone, 
                    contactName: displayName,
                    contactPhone: phone, // Mantém o ID cru para referência técnica
                    lastMessage: appMsg.text,
                    lastMessageTime: appMsg.timestamp,
                    unreadCount: 0,
                    status: 'active',
                    platform: 'whatsapp',
                    tags: ['Histórico'],
                    messages: []
                });
            } else {
                // Atualiza o nome se encontrarmos um melhor depois (ex: mensagem mais recente tem o nome)
                const currentConv = conversationsMap.get(cleanPhone)!;
                // Se o nome atual for igual ao telefone formatado (genérico) e acharmos um nome real, atualiza
                const isGenericName = currentConv.contactName === formatPhone(currentConv.contactPhone);
                
                if (dbName && isGenericName) {
                    currentConv.contactName = dbName;
                }
            }

            const conv = conversationsMap.get(cleanPhone)!;
            conv.messages.push(appMsg);
            
            // Atualiza lastMessage baseado no timestamp
            if (appMsg.timestamp > conv.lastMessageTime) {
                conv.lastMessage = appMsg.text;
                conv.lastMessageTime = appMsg.timestamp;
            }
        });

        // Ordena as mensagens dentro de cada conversa carregada (segurança extra)
        conversationsMap.forEach(conv => {
            conv.messages = sortMessages(conv.messages);
        });

        const sortedConversations = Array.from(conversationsMap.values()).sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
        setConversations(sortedConversations);
        if (sortedConversations.length > 0) {
            setActiveConversationId(sortedConversations[0].id);
        }
    } else {
        setConversations([]); 
    }
    setIsLoadingHistory(false);
  };

  // 2. Conectar ao Realtime quando estiver configurado
  useEffect(() => {
    if (!isConfigured) return;

    // HANDLER 1: Novas Mensagens (INSERT)
    const handleNewRealtimeMessage = (newMessage: Message, phone: string, contactName?: string) => {
      setConversations(prevConversations => {
        const cleanPhone = phone.replace(/\D/g, '');
        
        const existingConvIndex = prevConversations.findIndex(c => 
          c.contactPhone.replace(/\D/g, '') === cleanPhone
        );

        if (existingConvIndex >= 0) {
          // --- Conversa Existente ---
          const updated = [...prevConversations];
          const targetConv = updated[existingConvIndex];

          // Evita duplicatas
          if (targetConv.messages.some(m => m.id === newMessage.id)) {
            return prevConversations;
          }

          // Atualiza nome se vier preenchido
          let newName = targetConv.contactName;
          const isGenericName = targetConv.contactName === formatPhone(targetConv.contactPhone);
          if (contactName && isGenericName) {
              newName = contactName;
          }

          // Adiciona a nova mensagem e ORDENA por data + ID
          const newMessagesList = sortMessages([...targetConv.messages, newMessage]);

          updated[existingConvIndex] = {
            ...targetConv,
            contactName: newName,
            messages: newMessagesList,
            lastMessage: newMessage.text,
            lastMessageTime: newMessage.timestamp,
            unreadCount: (targetConv.id === activeConversationId) ? 0 : targetConv.unreadCount + 1,
            status: 'active' as const
          };
          
          return updated.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

        } else {
          // --- Nova Conversa ---
          const newConvId = phone; 
          
          const newConversation: Conversation = {
            id: newConvId,
            contactName: contactName || formatPhone(phone), 
            contactPhone: phone,
            lastMessage: newMessage.text,
            lastMessageTime: newMessage.timestamp,
            unreadCount: 1,
            status: 'active' as const,
            platform: 'whatsapp',
            tags: ['Novo'],
            messages: [newMessage]
          };

          return [newConversation, ...prevConversations];
        }
      });
    };

    // HANDLER 2: Atualização de Mensagens (UPDATE - ex: status delivered/read)
    const handleMessageUpdate = (updatedMessage: Message, phone: string) => {
        setConversations(prevConversations => {
            const cleanPhone = phone.replace(/\D/g, '');
            
            return prevConversations.map(conv => {
                // Se for a conversa correta
                if (conv.contactPhone.replace(/\D/g, '') === cleanPhone) {
                    const updatedMsgs = conv.messages.map(m => 
                        m.id === updatedMessage.id ? updatedMessage : m
                    );
                    return {
                        ...conv,
                        messages: sortMessages(updatedMsgs) // Mantém ordenado
                    };
                }
                return conv;
            });
        });
    };

    // Conecta os listeners
    realtimeService.connect(handleNewRealtimeMessage, handleMessageUpdate);

    return () => {
      realtimeService.disconnect();
    };
  }, [isConfigured, activeConversationId]); 

  const handleSaveConfig = (newConfig: SystemConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setConfig(newConfig);
    setIsConfigured(true);
    realtimeService.initialize(newConfig.supabaseUrl, newConfig.supabaseKey);
    loadHistory(); // Recarrega com novas credenciais
    setCurrentView('live-chat');
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversationId) return;
    const activeConv = conversations.find(c => c.id === activeConversationId);
    if (!activeConv) return;

    if (!isConfigured) {
        alert("Configure o Supabase na aba Configurações primeiro.");
        setCurrentView('settings');
        return;
    }

    // Otimista (ID temporário muito alto para ficar no final até o real chegar)
    const now = new Date();
    const tempId = 'temp-' + Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      text: text,
      senderId: 'agent',
      timestamp: now,
      createdAtRaw: now.toISOString(),
      status: 'sent',
      type: 'text'
    };

    setConversations(prev => prev.map(conv => {
      if (conv.id === activeConversationId) {
        return {
          ...conv,
          messages: sortMessages([...conv.messages, optimisticMessage]), // Ordena também no envio otimista
          lastMessage: text,
          lastMessageTime: new Date()
        };
      }
      return conv;
    }));

    try {
        await realtimeService.sendMessage(text, activeConv.contactPhone);
    } catch (error) {
        console.error("Erro ao enviar:", error);
        alert("Erro ao enviar mensagem. Verifique suas credenciais.");
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex h-screen bg-[#00020A] text-white font-sans overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />

      <main className="flex-1 flex overflow-hidden">
        {/* Passando as conversas reais para o Dashboard */}
        {currentView === 'dashboard' && <Dashboard conversations={conversations} />}

        {currentView === 'settings' && (
            <div className="w-full">
                <Settings config={config} onSave={handleSaveConfig} />
            </div>
        )}

        {currentView === 'live-chat' && (
          <div className="flex w-full h-full">
            <ConversationList 
              conversations={conversations} 
              activeId={activeConversationId} 
              onSelect={setActiveConversationId} 
            />
            <div className="flex-1 h-full">
              {isLoadingHistory ? (
                <div className="flex-1 h-full flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-af-blue mb-4"></div>
                    <p className="text-af-gray-200">Carregando histórico de mensagens...</p>
                </div>
              ) : activeConversation ? (
                <ChatWindow 
                  conversation={activeConversation} 
                  onSendMessage={handleSendMessage} 
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-af-gray-300">
                    <div className="w-20 h-20 rounded-full bg-af-blue/10 flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-af-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                  <p className="text-xl font-heading font-bold text-white">Pronto para Atender</p>
                  <p className="text-sm text-center max-w-md mt-2 text-af-gray-200">
                      Conectado ao Supabase com sucesso. 
                      <br/>
                      {conversations.length === 0 
                        ? "Nenhuma mensagem encontrada no histórico." 
                        : "Selecione uma conversa ao lado para começar."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {(currentView === 'history' || currentView === 'analytics') && (
           <div className="flex items-center justify-center w-full h-full flex-col">
              <h2 className="text-3xl font-heading font-bold text-af-gray-300">Em Desenvolvimento</h2>
              <p className="text-af-gray-300 mt-2">Este módulo estará disponível na próxima versão.</p>
           </div>
        )}
      </main>
    </div>
  );
}

export default App;