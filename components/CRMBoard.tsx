import React, { useState, useMemo } from 'react';
import { Contact } from '../types';
import { Filter, Search, Building2, Flame, Snowflake, ThermometerSun, AlertCircle } from 'lucide-react';
import { formatPhone } from '../utils';

interface CRMBoardProps {
    contacts: Contact[];
}

// Configuração das Colunas do Pipeline
const PIPELINE_COLUMNS = [
    { id: 'novo', label: 'Novos Leads', color: 'border-blue-500' },
    { id: 'atendimento', label: 'Em Atendimento', color: 'border-yellow-500' },
    { id: 'morno', label: 'Interessados (Morno)', color: 'border-orange-500' },
    { id: 'quente', label: 'Proposta (Quente)', color: 'border-red-500' },
    { id: 'fechado', label: 'Fechado/Ganho', color: 'border-green-500' }
];

export const CRMBoard: React.FC<CRMBoardProps> = ({ contacts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [segmentFilter, setSegmentFilter] = useState<string>('all');

    // Extrair segmentos únicos para o filtro
    const uniqueSegments = useMemo(() => {
        const segs = new Set<string>();
        contacts.forEach(c => {
            if (c.segmento) segs.add(c.segmento);
        });
        return Array.from(segs);
    }, [contacts]);

    // Filtrar e Organizar Contatos nas Colunas
    const boardData = useMemo(() => {
        const columns: Record<string, Contact[]> = {
            novo: [],
            atendimento: [],
            morno: [],
            quente: [],
            fechado: [],
            outros: [] // Fallback
        };

        contacts.forEach(contact => {
            // 1. Filtros
            if (segmentFilter !== 'all' && contact.segmento !== segmentFilter) return;
            if (searchTerm && !contact.name.toLowerCase().includes(searchTerm.toLowerCase()) && !contact.phone.includes(searchTerm)) return;

            // 2. Mapeamento de Status (Normalização)
            const statusLower = (contact.status || '').toLowerCase();
            const tempLower = (contact.temperatura || '').toLowerCase();
            
            // Lógica inteligente para decidir em qual coluna cai
            // Baseado no Status ou na Temperatura se o status for vago
            if (statusLower.includes('fechado') || statusLower.includes('ganho')) {
                columns.fechado.push(contact);
            } else if (tempLower === 'quente' || statusLower.includes('proposta')) {
                columns.quente.push(contact);
            } else if (tempLower === 'morno' || statusLower.includes('morno')) {
                columns.morno.push(contact);
            } else if (statusLower.includes('atendimento')) {
                columns.atendimento.push(contact);
            } else {
                columns.novo.push(contact); // Default para novos
            }
        });

        return columns;
    }, [contacts, searchTerm, segmentFilter]);

    const getTempIcon = (temp?: string) => {
        const t = (temp || '').toLowerCase();
        if (t.includes('quente')) return <Flame size={12} className="text-red-500" />;
        if (t.includes('frio')) return <Snowflake size={12} className="text-blue-300" />;
        if (t.includes('morno')) return <ThermometerSun size={12} className="text-orange-400" />;
        return null;
    };

    return (
        <div className="flex flex-col h-full bg-af-black">
            {/* Header / Toolbar */}
            <div className="px-6 py-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-heading">Pipeline de Vendas</h1>
                    <p className="text-xs text-af-gray-200">Gestão visual de leads por estágio e temperatura.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filtro de Segmento */}
                    <div className="relative">
                        <select 
                            value={segmentFilter}
                            onChange={(e) => setSegmentFilter(e.target.value)}
                            className="bg-[#1E2028] border border-gray-700 text-white text-sm rounded-lg pl-3 pr-8 py-2 focus:border-af-blue appearance-none cursor-pointer"
                        >
                            <option value="all">Todos os Segmentos</option>
                            {uniqueSegments.map(seg => (
                                <option key={seg} value={seg}>{seg}</option>
                            ))}
                        </select>
                        <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Busca */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar lead..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#1E2028] border border-gray-700 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:border-af-blue w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Kanban Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex h-full gap-4 min-w-[1000px]">
                    {PIPELINE_COLUMNS.map(col => (
                        <div key={col.id} className="flex-1 flex flex-col h-full min-w-[280px] max-w-[350px] bg-[#0A0C14] rounded-xl border border-gray-800">
                            {/* Column Header */}
                            <div className={`p-4 border-b border-gray-800 flex justify-between items-center border-t-4 ${col.color} rounded-t-xl`}>
                                <h3 className="font-bold text-white text-sm uppercase tracking-wide">{col.label}</h3>
                                <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">
                                    {boardData[col.id]?.length || 0}
                                </span>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {boardData[col.id]?.length === 0 ? (
                                    <div className="text-center py-10 opacity-30">
                                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 mx-4">
                                            <p className="text-xs">Sem leads nesta etapa</p>
                                        </div>
                                    </div>
                                ) : (
                                    boardData[col.id]?.map(contact => (
                                        <div key={contact.id} className="bg-[#1E2028] p-4 rounded-lg border border-gray-700 hover:border-af-blue/50 transition-all shadow-sm group cursor-pointer relative overflow-hidden">
                                            
                                            {/* Temperatura Lateral */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                (contact.temperatura || '').toLowerCase().includes('quente') ? 'bg-red-500' : 
                                                (contact.temperatura || '').toLowerCase().includes('morno') ? 'bg-orange-400' : 'bg-blue-900'
                                            }`} />

                                            <div className="pl-2">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-white text-sm truncate pr-2">{contact.name}</h4>
                                                    {getTempIcon(contact.temperatura)}
                                                </div>
                                                
                                                <p className="text-xs text-af-blue mb-2 font-mono">{formatPhone(contact.phone)}</p>
                                                
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {contact.segmento && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 border border-gray-700">
                                                            <Building2 size={10} />
                                                            {contact.segmento}
                                                        </span>
                                                    )}
                                                    {contact.cargo && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">
                                                            {contact.cargo}
                                                        </span>
                                                    )}
                                                </div>

                                                {!contact.segmento && !contact.cargo && (
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-yellow-500/70">
                                                        <AlertCircle size={10} />
                                                        <span>Faltam dados</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
