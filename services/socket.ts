import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Message, Contact } from '../types';

// Atualizado para aceitar opcionalmente o contactName
type MessageCallback = (msg: Message, phone: string, contactName?: string) => void;

class RealtimeService {
  private supabase: SupabaseClient | null = null;
  private subscription: any = null;
  private isConnected: boolean = false;

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
   * Busca dados do contato (CRM) pelo telefone
   */
  public async fetchContactByPhone(phone: string): Promise<Contact | null> {
      if (!this.supabase) return null;
      
      // Remove caracteres não numéricos para garantir match
      const cleanPhone = phone.replace(/\D/g, '');

      try {
          // Tenta buscar onde o telefone contem o numero limpo (like) ou exato
          // Como o formato pode variar (+55...), usamos uma lógica simplificada
          const { data, error } = await this.supabase
            .from('contacts')
            .select('*')
            .ilike('phone', `%${cleanPhone}%`) 
            .single();

          if (error) {
              // Se não achar exact match, tenta buscar sem o filtro single e pega o primeiro
              if (error.code === 'PGRST116') return null; // Não encontrado
              console.warn('Erro ao buscar contato:', error.message);
              return null;
          }

          return data as Contact;
      } catch (err) {
          console.error('Erro na busca de contato:', err);
          return null;
      }
  }

  /**
   * Busca histórico de mensagens do banco
   */
  public async fetchHistory(): Promise<any[]> {
    if (!this.supabase) return [];

    try {
        // Busca as últimas 500 mensagens ordenadas por data
        const { data, error } = await this.supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(500);

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
   * Agora aceita callback para novas mensagens E atualizações
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
             // Tenta pegar o nome de várias colunas comuns
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

  /**
   * Helper para transformar dados do banco no formato do App
   */
  private mapPayloadToMessage(dbMsg: any): Message | null {
      if (!dbMsg) return null;
      
      const senderId = dbMsg.direction === 'outbound' ? 'agent' : 'customer';
          
      return {
        id: dbMsg.id,
        text: dbMsg.content || '',
        senderId: senderId,
        timestamp: new Date(dbMsg.created_at),
        createdAtRaw: dbMsg.created_at, // Salva a string original
        status: dbMsg.status || 'delivered',
        type: dbMsg.type || 'text'
      };
  }

  /**
   * Envia mensagem (Insere no banco para o n8n pegar)
   */
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
