
import React from 'react';
import { Contact } from '../types';
import { 
    Briefcase, 
    Building2, 
    Flame, 
    Snowflake, 
    ThermometerSun, 
    BrainCircuit, 
    ExternalLink,
    Tag,
    Clock
} from 'lucide-react';
import { formatPhone } from '../utils';

interface ContactDrawerProps {
  contact: Contact | null;
  isLoading: boolean;
  phone: string; // Telefone da conversa (caso não tenha contato no banco ainda)
  name: string;  // Nome da conversa
}

export const ContactDrawer: React.FC<ContactDrawerProps> = ({ contact, isLoading, phone, name }) => {
    
  // Helper para limpar dados visuais
  const cleanData = (text?: string) => {
    if (!text || text === 'EMPTY' || text === 'NULL') return '-';
    return text;
  };

  // Renderização de Estado Vazio ou Carregando
  if (isLoading) {
      return (
          <div className="w-80 bg-af-black border-l border-gray-800 p-6 flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-af-blue mb-4"></div>
              <p className="text-gray-400 text-sm">Carregando dados do CRM...</p>
          </div>
      );
  }

  // Renderização se não houver dados no banco 'contacts'
  if (!contact) {
      return (
        <div className="w-80 bg-af-black border-l border-gray-800 p-6 h-full overflow-y-auto">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-500">
                    {name.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-white font-heading">{name}</h2>
                <p className="text-af-blue text-sm mt-1">{formatPhone(phone)}</p>
            </div>
            
            <div className="bg-[#1E2028] p-4 rounded-xl border border-gray-700 text-center">
                <p className="text-gray-400 text-sm">Este contato ainda não possui ficha cadastrada no CRM.</p>
                <button className="mt-4 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors w-full">
                    Sincronizar Dados
                </button>
            </div>
        </div>
      );
  }

  // Helpers para visualização
  const getTemperatureIcon = (temp?: string) => {
      const t = temp?.toLowerCase() || '';
      if (t.includes('quente')) return <Flame className="text-red-500" />;
      if (t.includes('frio')) return <Snowflake className="text-blue-300" />;
      return <ThermometerSun className="text-orange-400" />;
  };

  const getTemperatureColor = (temp?: string) => {
    const t = temp?.toLowerCase() || '';
    if (t.includes('quente')) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (t.includes('frio')) return 'text-blue-300 bg-blue-500/10 border-blue-500/20';
    return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
  };

  return (
    <div className="w-80 bg-af-black border-l border-gray-800 h-full overflow-y-auto custom-scrollbar flex flex-col">
        {/* Header Profile */}
        <div className="p-6 border-b border-gray-800 text-center relative overflow-hidden">
             {/* Background glow based on temperature */}
             <div className={`absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none 
                ${contact.temperatura?.toLowerCase().includes('quente') ? 'bg-red-600' : 'bg-blue-600'}`} 
             />

            <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white border-4 border-af-black shadow-xl">
                    {contact.name.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-white font-heading leading-tight">{contact.name}</h2>
                <p className="text-af-blue font-mono text-sm mt-1 mb-3">{formatPhone(contact.phone)}</p>
                
                {/* Pipedrive / CRM Link */}
                {contact.pipedrive_id && (
                    <a 
                        href={`https://pipedrive.com/deal/${contact.pipedrive_id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] bg-[#1E2028] hover:bg-[#2a2d38] border border-gray-700 text-gray-300 px-2 py-1 rounded transition-colors"
                    >
                        <ExternalLink size={10} />
                        Pipedrive: #{contact.pipedrive_id}
                    </a>
                )}
            </div>
        </div>

        <div className="p-6 space-y-6 flex-1">
            
            {/* AI Summary Card - THE INNOVATION */}
            <div className="bg-gradient-to-br from-[#1E2028] to-[#15171e] rounded-xl p-4 border border-af-blue/30 shadow-lg relative group">
                <div className="absolute -top-3 -right-2 bg-af-blue text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                    <BrainCircuit size={12} />
                    AutoForce AI
                </div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resumo Inteligente</h3>
                <p className="text-sm text-gray-200 leading-relaxed italic">
                    "{contact.resumo_ia || "Aguardando processamento da IA para gerar resumo do perfil..."}"
                </p>
            </div>

            {/* Vital Signs (Status & Temp) */}
            <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 ${getTemperatureColor(contact.temperatura)}`}>
                    {getTemperatureIcon(contact.temperatura)}
                    <span className="text-xs font-bold uppercase">{cleanData(contact.temperatura) || 'N/A'}</span>
                    <span className="text-[9px] opacity-70">Temperatura</span>
                </div>
                
                <div className="p-3 rounded-lg border border-gray-700 bg-[#1E2028] flex flex-col items-center justify-center gap-1 text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold uppercase text-center truncate w-full">{cleanData(contact.status) || 'Novo'}</span>
                    <span className="text-[9px] text-gray-500">Status</span>
                </div>
            </div>

            {/* Professional Info */}
            <div>
                <h3 className="text-xs font-bold text-af-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Briefcase size={14} />
                    Dados Profissionais
                </h3>
                <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-sm">
                        <Building2 size={16} className="text-gray-500 mt-0.5" />
                        <div>
                            <span className="block text-gray-400 text-xs">Empresa</span>
                            <span className="text-white font-medium">{cleanData(contact.empresa)}</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                        <Tag size={16} className="text-gray-500 mt-0.5" />
                        <div>
                            <span className="block text-gray-400 text-xs">Cargo</span>
                            <span className="text-white font-medium">{cleanData(contact.cargo)}</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-3 text-sm">
                        <div className="w-4 flex justify-center mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-af-blue"></span>
                        </div>
                        <div>
                            <span className="block text-gray-400 text-xs">Segmento</span>
                            <span className="text-white font-medium">{cleanData(contact.segmento)}</span>
                        </div>
                    </li>
                </ul>
            </div>
            
            {/* Last Interaction */}
            {contact.ultima_interacao && (
                <div className="pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>Última interação: {new Date(contact.ultima_interacao).toLocaleDateString()}</span>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
