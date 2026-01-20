import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Message, Contact } from '../types';

// Atualizado para aceitar opcionalmente o contactName
type MessageCallback = (msg: Message, phone: string, contactName?: string) => void;

class RealtimeService {
  private supabase: SupabaseClient | null = null;
  private subscription: any = null;
  private isConnected: boolean = false;
  
  // CACHE: Armazena contatos em memória para acesso instantâneo (Chave: Telefone Limpo)
  private contactCache: Map<string, Contact> = new Map();

  /**
   * Inicializa o cliente Supabase com as credenciais
   */
  public initialize(url: string, key: string) {
    if (!url || !key) return;
    
    // Se já estiver inicializado com as mesmas configs, ignora
    if (this.supabase) {
        this.disconnect();
    }

    try {
        this.supabase = createClient(url, key);
        this.isConnected = true;
        console.log('Supabase Service: Cliente inicializado');
    } catch (e) {
        console.error('Supabase Service: Erro ao inicializar', e);
        this.isConnected = false;
    }
  }

  /**
   * Busca dados de UM contato (Mini CRM) com suporte a Cache
   */
  public async fetchContactByPhone(phone: string): Promise<Contact | null> {
      if (!this.supabase) return null;
      const cleanPhone = phone.replace(/\D/g, '');

      // 1. Verifica se já está no cache
      if (this.contactCache.has(cleanPhone)) {
          console.log('Cache Hit: Contato recuperado da memória', cleanPhone);
          return this.contactCache.get(cleanPhone) || null;
      }

      try {
          // 2. Se não estiver, busca no banco
          const { data, error } = await this.supabase
            .from('contacts')
            .select('*')
            .ilike('phone', `%${cleanPhone}%`) 
            .single();

          if (error) {
              if (error.code === 'PGRST116') return null; 
              console.warn('Erro ao buscar contato individual:', error.message);
              return null;
          }

          const contact = data as Contact;
          
          // 3. Salva no cache para a próxima vez
          if (contact) {
              this.contactCache.set(cleanPhone, contact);
          }

          return contact;
      } catch (err) {
          console.error('Erro na busca de contato:', err);
          return null;
      }
  }

  /**
   * Busca TODOS os contatos para o Kanban/Dashboard e popula o Cache
   */
  public async fetchAllContacts(): Promise<Contact[]> {
      if (!this.supabase) return [];

      try {
          const { data, error } = await this.supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
              console.error('Erro ao buscar lista de contatos:', error);
              return [];
          }

          const contacts = (data as Contact[]) || [];

          // Popula o cache massivamente
          contacts.forEach(c => {
              if (c.phone) {
                  const clean = c.phone.replace(/\D/g, '');
                  this.contactCache.set(clean, c);
              }
          });

          return contacts;
      } catch (err) {
          console.error('Erro fatal ao buscar todos contatos:', err);
          return [];
      }
  }

  /**
   * Busca histórico de mensagens do banco
   */
  public async fetchHistory(): Promise<any[]> {
    if (!this.supabase) return [];

    try {
        // Busca as últimas 1000 mensagens ordenadas por data
        const { data, error } = await this.supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(1000); 

        if (error) {
            console.error('Erro ao buscar histórico:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Erro fatal ao buscar histórico:', error);
        return [];
    }
  }

  /**
   * Conecta ao canal Realtime do Supabase
   */
  public connect(onNewMessage: MessageCallback, onUpdateMessage: MessageCallback) {
    if (!this.supabase || !this.isConnected) {
        console.warn('Supabase Service: Tentativa de conectar sem inicializar (Verifique as Configurações)');
        return;
    }

    console.log('Iniciando conexão Realtime com Supabase...');
    
    if (this.subscription) {
      this.supabase.removeChannel(this.subscription);
    }

    this.subscription = this.supabase
      .channel('public:messages')
      // Evento: Nova Mensagem (INSERT)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = this.mapPayloadToMessage(payload.new);
          if (msg && payload.new.phone) {
             const name = payload.new.contact_name || payload.new.name || payload.new.push_name || payload.new.sender_name;
             onNewMessage(msg, payload.new.phone, name);
          }
        }
      )
      // Evento: Atualização de Status (UPDATE)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = this.mapPayloadToMessage(payload.new);
          if (msg && payload.new.phone) {
             const name = payload.new.contact_name || payload.new.name || payload.new.push_name || payload.new.sender_name;
             onUpdateMessage(msg, payload.new.phone, name);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Monitorando tabela "messages" em tempo real!');
        }
      });
  }

  private mapPayloadToMessage(dbMsg: any): Message | null {
      if (!dbMsg) return null;
      
      const senderId = dbMsg.direction === 'outbound' ? 'agent' : 'customer';
          
      return {
        id: dbMsg.id,
        text: dbMsg.content || '',
        senderId: senderId,
        timestamp: new Date(dbMsg.created_at),
        createdAtRaw: dbMsg.created_at,
        status: dbMsg.status || 'delivered',
        type: dbMsg.type || 'text'
      };
  }

  public async sendMessage(text: string, phone: string): Promise<void> {
    if (!this.supabase) throw new Error("Supabase não configurado");

    const { error } = await this.supabase
      .from('messages')
      .insert({
        content: text,          
        phone: phone,           
        direction: 'outbound',  
        type: 'text',
        status: 'sent',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao salvar no Supabase:', error);
      throw error;
    }
  }

  public disconnect() {
    if (this.subscription && this.supabase) {
      this.supabase.removeChannel(this.subscription);
    }
  }
  
  public getStatus() {
      return this.isConnected;
  }
}

export const realtimeService = new RealtimeService();
