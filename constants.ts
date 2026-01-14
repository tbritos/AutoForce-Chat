import { Conversation, SystemConfig } from './types';

// Credenciais padrão fornecidas pelo usuário
export const DEFAULT_SUPABASE_CONFIG: SystemConfig = {
  supabaseUrl: 'https://zllilizvdkfmeupiekdt.supabase.co',
  supabaseKey: 'sb_publishable_1i6h6CUyk-OQ_EuaQlX1mA_5gXC9Fz5'
};

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    contactName: 'Exemplo Local',
    contactPhone: '55999999999',
    lastMessage: 'Aguardando conexão com o banco de dados...',
    lastMessageTime: new Date(),
    unreadCount: 0,
    status: 'active',
    platform: 'whatsapp',
    tags: ['Sistema'],
    messages: []
  }
];

export const KPIS = [
  { label: 'Em Atendimento', value: '24', change: '+12%', color: 'text-af-blue' },
  { label: 'Na Fila', value: '08', change: '-2%', color: 'text-af-orange' },
  { label: 'Finalizados Hoje', value: '142', change: '+5%', color: 'text-af-gray-100' },
  { label: 'Tempo Médio', value: '4m 12s', change: '-10s', color: 'text-green-500' },
];