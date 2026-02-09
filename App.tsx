
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ConversationList } from './components/ConversationList';
import { ChatWindow } from './components/ChatWindow';
import { ContactDrawer } from './components/ContactDrawer';
import { CRMBoard } from './components/CRMBoard';
import { ContactList } from './components/ContactList'; 
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { MOCK_CONVERSATIONS, DEFAULT_SUPABASE_CONFIG } from './constants';
import { Conversation, ViewState, Message, SystemConfig, Contact } from './types';
import { realtimeService } from './services/socket';
import { formatPhone, playNotificationSound } from './utils';

const STORAGE_KEY = 'autoforce_monitor_config';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('live-chat');
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'>('DISCONNECTED');

  // CRM States
  const [allContacts, setAllContacts] = useState<Contact[]>([]); 
  const [activeContact, setActiveContact] = useState<Contact | null>(null); 
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  
  const activeConversationIdRef = useRef(activeConversationId);
  
  // Config States
  const [config, setConfig] = useState<SystemConfig>({ supabaseUrl: '', supabaseKey: '' });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
    // Reseta o título da página quando abre uma conversa
    if (activeConversationId) {
        document.title = "AutoForce Monitor";
    }
  }, [activeConversationId]);

  // Carregar todos os contatos (CRM) quando configurado E LOGADO
  const loadCRMData = async () => {
     if (isConfigured && session) {
         const contacts = await realtimeService.fetchAllContacts();
         setAllContacts(contacts);
     }
  };

  useEffect(() => {
      loadCRMData();
  }, [isConfigured, session]);

  // Efeito OTIMIZADO para carregar contato individual usando Cache
  useEffect(() => {
      const fetchIndividualContact = async () => {
          if (!activeConversationId || !isConfigured || !session) {
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
      fetchIndividualContact();
  }, [activeConversationId, isConfigured, session]);

  // Helper de ordenação
  const sortMessages = (msgs: Message[]) => {
      return msgs.sort((a, b) => {
        const timeA = a.createdAtRaw ? new Date(a.createdAtRaw).getTime() : new Date(a.timestamp).getTime();
        const timeB = b.createdAtRaw ? new Date(b.createdAtRaw).getTime() : new Date(b.timestamp).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      });
  };

  // Inicialização do Sistema e Auth
  useEffect(() => {
    const initSystem = async (url: string, key: string) => {
        setConfig({ supabaseUrl: url, supabaseKey: key });
        setIsConfigured(true);
        realtimeService.initialize(url, key);
        
        // Verificar sessão Auth
        try {
            const currentSession = await realtimeService.getSession();
            setSession(currentSession);
            
            if (currentSession) {
                await loadHistory();
            }

            // Escutar mudanças de Auth (Login/Logout)
            const { data: { subscription } } = realtimeService.onAuthStateChange((newSession) => {
                setSession(newSession);
                if (newSession) {
                    loadHistory();
                    loadCRMData();
                } else {
                    setConversations(MOCK_CONVERSATIONS); // Limpa dados ao sair
                    setAllContacts([]);
                    setConnectionStatus('DISCONNECTED');
                }
            }) as any;

            return () => subscription?.unsubscribe();

        } catch (error) {
            console.error("Erro na verificação de auth:", error);
        } finally {
            setIsAuthChecking(false);
        }
    };

    const savedConfig = localStorage.getItem(STORAGE_KEY);
    
    // Lógica de Inicialização
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.supabaseUrl && parsed.supabaseKey) {
        initSystem(parsed.supabaseUrl, parsed.supabaseKey);
        return;
      }
    } else if (DEFAULT_SUPABASE_CONFIG.supabaseUrl && DEFAULT_SUPABASE_CONFIG.supabaseKey) {
        initSystem(DEFAULT_SUPABASE_CONFIG.supabaseUrl, DEFAULT_SUPABASE_CONFIG.supabaseKey);
    } else {
        // Sem config, vai para settings e para de carregar auth
        setIsConfigured(false);
        setIsAuthChecking(false);
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
                if (dbName && isGenericName) currentConv.contactName = dbName;
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
        if (sortedConversations.length > 0) setActiveConversationId(sortedConversations[0].id);
    } else {
        setConversations([]); 
    }
    setIsLoadingHistory(false);
  };

  // Realtime Listeners
  useEffect(() => {
    if (!isConfigured || !session) return; // Só conecta se tiver config E sessão

    const handleNewRealtimeMessage = (newMessage: Message, phone: string, contactName?: string) => {
      // 1. Toca som se for mensagem de cliente
      if (newMessage.senderId === 'customer') {
          playNotificationSound();
          document.title = "(1) Nova Mensagem | AutoForce";
      }

      setConversations(prevConversations => {
        const cleanPhone = phone.replace(/\D/g, '');
        const currentActiveId = activeConversationIdRef.current;
        
        const existingConvIndex = prevConversations.findIndex(c => 
          c.contactPhone.replace(/\D/g, '') === cleanPhone
        );

        if (existingConvIndex >= 0) {
          const updated = [...prevConversations];
          const targetConv = updated[existingConvIndex];
          if (targetConv.messages.some(m => m.id === newMessage.id)) return prevConversations;

          let newName = targetConv.contactName;
          const isGenericName = targetConv.contactName === formatPhone(targetConv.contactPhone);
          if (contactName && isGenericName) newName = contactName;

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
          const newConversation: Conversation = {
            id: phone,
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
                    return { ...conv, messages: sortMessages(updatedMsgs) };
                }
                return conv;
            });
        });
    };

    const handleConnectionStatus = (status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING') => {
        setConnectionStatus(status);
    };

    realtimeService.connect(handleNewRealtimeMessage, handleMessageUpdate, handleConnectionStatus);
    return () => realtimeService.disconnect();
  }, [isConfigured, session]);

  const handleSaveConfig = (newConfig: SystemConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setConfig(newConfig);
    setIsConfigured(true);
    // Reinicializa e tenta carregar auth
    window.location.reload(); // Recarregar para garantir estado limpo
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversationId) return;
    const activeConv = conversations.find(c => c.id === activeConversationId);
    if (!activeConv) return;
    if (!isConfigured || !session) {
        alert("Sessão expirada ou sistema não configurado.");
        return;
    }

    const now = new Date();
    const tempId = 'temp-' + Date.now();
    const optimisticMessage: Message = {
      id: tempId, text, senderId: 'agent', timestamp: now, createdAtRaw: now.toISOString(), status: 'sent', type: 'text'
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
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // --- RENDERIZAÇÃO CONDICIONAL (ROTAS) ---

  // 1. Carregando Inicial
  if (isAuthChecking) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-[#00020A]">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-af-blue mb-4"></div>
                <p className="text-gray-400 text-sm">Iniciando Monitor...</p>
              </div>
          </div>
      );
  }

  // 2. Não Configurado -> Tela de Configurações
  if (!isConfigured) {
      return <Settings config={config} onSave={handleSaveConfig} />;
  }

  // 3. Configurado mas Sem Sessão -> Tela de Login
  if (!session) {
      return <Login />;
  }

  // 4. Configurado e Logado -> APP PRINCIPAL
  return (
    <div className="flex h-screen bg-[#00020A] text-white font-sans overflow-hidden">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} connectionStatus={connectionStatus} />

      <main className="flex-1 flex overflow-hidden">
        {/* Dashboard */}
        {currentView === 'dashboard' && (
          <div className="w-full h-full">
            <Dashboard conversations={conversations} contacts={allContacts} />
          </div>
        )}

        {/* Configurações (Interna) */}
        {currentView === 'settings' && (
            <div className="w-full"><Settings config={config} onSave={handleSaveConfig} /></div>
        )}

        {/* CRM KANBAN */}
        {currentView === 'crm' && (
             <div className="w-full h-full">
                <CRMBoard contacts={allContacts} />
             </div>
        )}

        {/* BASE DE LEADS (TABELA) */}
        {currentView === 'history' && (
             <div className="w-full h-full">
                <ContactList contacts={allContacts} />
             </div>
        )}

        {/* CHAT EM TEMPO REAL */}
        {currentView === 'live-chat' && (
          <div className="flex w-full h-full">
            <ConversationList 
              conversations={conversations} 
              activeId={activeConversationId} 
              onSelect={setActiveConversationId} 
            />
            <div className="flex-1 flex h-full">
                <div className="flex-1 min-w-0 h-full border-r border-gray-800">
                    {isLoadingHistory ? (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-af-blue mb-4"></div>
                            <p className="text-af-gray-200">Carregando Histórico...</p>
                        </div>
                    ) : activeConversation ? (
                        <ChatWindow conversation={activeConversation} onSendMessage={handleSendMessage} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-af-gray-300">
                            <div className="w-20 h-20 rounded-full bg-af-blue/10 flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-af-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-xl font-heading font-bold text-white">Pronto para Atender</p>
                        </div>
                    )}
                </div>
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

        {currentView === 'analytics' && (
           <div className="flex items-center justify-center w-full h-full flex-col">
                <div className="text-center">
                    <h2 className="text-3xl font-heading font-bold text-af-gray-300">Em Desenvolvimento</h2>
                </div>
           </div>
        )}
      </main>
    </div>
  );
}

export default App;
