export interface User {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  status: 'online' | 'offline' | 'busy';
}

export interface Message {
  id: string;
  text: string;
  senderId: string; // 'agent' or 'customer'
  timestamp: Date;
  createdAtRaw?: string; // Data em string ISO para ordenação precisa (inclui microsegundos)
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'system';
}

export interface Conversation {
  id: string;
  contactName: string;
  contactPhone: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  status: 'active' | 'waiting' | 'finished';
  platform: 'whatsapp' | 'instagram' | 'email';
  tags: string[];
  messages: Message[];
}

export type ViewState = 'dashboard' | 'live-chat' | 'history' | 'settings' | 'analytics';

export interface ChartData {
  name: string;
  value: number;
}

export interface SystemConfig {
  supabaseUrl: string;
  supabaseKey: string;
}