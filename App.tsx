import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { ContactDrawer } from './components/ContactDrawer'; // Importando o CRM
import { Settings } from './components/Settings';
import { MOCK_CONVERSATIONS, DEFAULT_SUPABASE_CONFIG } from './constants';
import { Conversation, ViewState, Message, SystemConfig, Contact } from './types';
import { realtimeService } from './services/socket';
import { formatPhone } from './utils';

// Chave para salvar no localStorage
const STORAGE_KEY = 'autoforce_monitor_config';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('live-chat');
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // Estados para o CRM
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  
  // Refs para manter estado atualizado dentro dos callbacks do Socket
  const activeConversationIdRef = useRef(activeConversationId);
  const conversationsRef = useRef(conversations);

  // Estado das configurações
  const [config, setConfig] = useState<SystemConfig>({ supabaseUrl: '', supabaseKey: '' });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Mantém os Refs atualizados
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // EFEITO: Buscar dados do CRM sempre que a conversa ativa mudar
  useEffect(() => {
      const fetchCRMData = async () => {
          if (!activeConversationId || !isConfigured) {
              setActiveContact(null);
              return;
          }

          const conv = conversations.find(c => c.id === activeConversationId);
          if (conv) {
              setIsLoadingContact(true);
              const contactData = await realtimeService.fetchContactByPhone(conv.contactPhone);
              setActiveContact(contactData);
              setIsLoadingContact(false);
          }
      };

      fetchCRMData();
  }, [activeConversationId, isConfigured]); // Removido 'conversations' para evitar loop, usa activeConversationId como gatilho

  // Helper para ordenar mensagens
  const sortMessages = (msgs: Message[]) => {
      return msgs.sort((a, b) => {
        const timeA = a.createdAtRaw ? new Date(a.createdAtRaw).getTime() : new Date(a.timestamp).getTime();
        const timeB = b.createdAtRaw ? new Date(b.createdAtRaw).getTime() : new Date(b.timestamp).getTime();
        
        if (timeA !== timeB) return timeA - timeB;
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });
  };

  // 1. Carregar configurações
  useEffect(() => {
    const initSystem = async (url: string, key: string) => {
        setConfig({ supabaseUrl: url, supabaseKey: key });
        setIsConfigured(true);
        realtimeService.initialize(url, key);
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

    if (DEFAULT_SUPABASE_CONFIG.supabaseUrl && DEFAULT_SUPABASE_CONFIG.supabaseKey) {
        initSystem(DEFAULT_SUPABASE_CONFIG.supabaseUrl, DEFAULT_SUPABASE_CONFIG.supabaseKey);
    } else {
        setCurrentView('settings');
    }
  }, []);

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
                id: msg.id ? String(msg.id) : `temp-${Date.now()}-${Math.random()}`,
                text: msg.content || '',
                senderId: msg.direction === 'outbound' ? 'agent' : 'customer',
                timestamp: new Date(msg.created_at),
                createdAtRaw: msg.created_at,
                status: msg.status || 'delivered',
                type: msg.type || 'text'
            };

            const dbName = msg.contact_name || msg.name || msg.push_name || msg.sender_name;
            const displayName = dbName || formatPhone(phone);

            if (!conversationsMap.has(cleanPhone)) {
                conversationsMap.set(cleanPhone, {
                    id: phone, 
                    contactName: displayName,
                    contactPhone: phone,
                    lastMessage: appMsg.text,
                    lastMessageTime: appMsg.timestamp,
                    unreadCount: 0,
                    status: 'active',
                    platform: 'whatsapp',
                    tags: ['Histórico'],
                    messages: []
                });
            } else {
                const currentConv = conversationsMap.get(cleanPhone)!;
                const isGenericName = currentConv.contactName === formatPhone(currentConv.contactPhone);
                if (dbName && isGenericName) {
                    currentConv.contactName = dbName;
                }
            }

            const conv = conversationsMap.get(cleanPhone)!;
            conv.messages.push(appMsg);
            
            if (appMsg.timestamp > conv.lastMessageTime) {
                conv.lastMessage = appMsg.text;
                conv.lastMessageTime = appMsg.timestamp;
            }
        });

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

  useEffect(() => {
    if (!isConfigured) return;

    const handleNewRealtimeMessage = (newMessage: Message, phone: string, contactName?: string) => {
      console.log('Nova mensagem recebida via Socket:', newMessage.text);
      
      setConversations(prevConversations => {
        const cleanPhone = phone.replace(/\D/g, '');
        const currentActiveId = activeConversationIdRef.current;
        
        const existingConvIndex = prevConversations.findIndex(c => 
          c.contactPhone.replace(/\D/g, '') === cleanPhone
        );

        if (existingConvIndex >= 0) {
          const updated = [...prevConversations];
          const targetConv = updated[existingConvIndex];

          if (targetConv.messages.some(m => m.id === newMessage.id)) {
            return prevConversations;
          }

          let newName = targetConv.contactName;
          const isGenericName = targetConv.contactName === formatPhone(targetConv.contactPhone);
          if (contactName && isGenericName) {
              newName = contactName;
          }

          const newMessagesList = sortMessages([...targetConv.messages, newMessage]);

          updated[existingConvIndex] = {
            ...targetConv,
            contactName: newName,
            messages: newMessagesList,
            lastMessage: newMessage.text,
            lastMessageTime: newMessage.timestamp,
            unreadCount: (targetConv.id === currentActiveId) ? 0 : targetConv.unreadCount + 1,
            status: 'active' as const
          };
          
          return updated.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

        } else {
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

    const handleMessageUpdate = (updatedMessage: Message, phone: string) => {
        setConversations(prevConversations => {
            const cleanPhone = phone.replace(/\D/g, '');
            
            return prevConversations.map(conv => {
                if (conv.contactPhone.replace(/\D/g, '') === cleanPhone) {
                    const updatedMsgs = conv.messages.map(m => 
                        m.id === updatedMessage.id ? updatedMessage : m
                    );
                    return {
                        ...conv,
                        messages: sortMessages(updatedMsgs)
                    };
                }
                return conv;
            });
        });
    };

    realtimeService.connect(handleNewRealtimeMessage, handleMessageUpdate);

    return () => {
      realtimeService.disconnect();
    };
  }, [isConfigured]);

  const handleSaveConfig = (newConfig: SystemConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setConfig(newConfig);
    setIsConfigured(true);
    realtimeService.initialize(newConfig.supabaseUrl, newConfig.supabaseKey);
    loadHistory();
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
          messages: sortMessages([...conv.messages, optimisticMessage]),
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
            
            {/* Wrapper Central: Chat + CRM */}
            <div className="flex-1 flex h-full">
                <div className="flex-1 min-w-0 h-full border-r border-gray-800">
                    {isLoadingHistory ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-af-blue mb-4"></div>
                            <p className="text-af-gray-200">Carregando...</p>
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
                            </p>
                        </div>
                    )}
                </div>

                {/* Renderização Condicional do CRM (ContactDrawer) se houver conversa ativa */}
                {activeConversation && (
                    <ContactDrawer 
                        contact={activeContact} 
                        isLoading={isLoadingContact} 
                        phone={activeConversation.contactPhone}
                        name={activeConversation.contactName}
                    />
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
