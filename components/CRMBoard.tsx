
import React, { useState, useMemo } from 'react';
import { Contact } from '../types';
import { 
    Filter, 
    Search, 
    Building2, 
    Flame, 
    Snowflake, 
    ThermometerSun, 
    AlertCircle, 
    LayoutList, 
    Columns,
    CheckCircle2,
    ArrowRightCircle,
    BrainCircuit,
    Calendar,
    FilterX
} from 'lucide-react';
import { formatPhone } from '../utils';

interface CRMBoardProps {
    contacts: Contact[];
}

// Configuração das Colunas de QUALIFICAÇÃO (Foco em Marketing/SDR)
const STATUS_COLUMNS = [
    { id: 'novo', label: 'Novos / Sem Dados', color: 'border-gray-500', icon: AlertCircle },
    { id: 'triagem', label: 'Em Triagem (IA)', color: 'border-blue-500', icon: BrainCircuit },
    { id: 'mql', label: 'MQL (Pronto p/ Vendas)', color: 'border-green-500', icon: CheckCircle2 },
    { id: 'frio', label: 'Descarte / Nutrição', color: 'border-slate-700', icon: Snowflake },
];

export const CRMBoard: React.FC<CRMBoardProps> = ({ contacts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'status' | 'segment'>('status');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Helper para limpar dados visuais (EMPTY/NULL)
    const cleanData = (text?: string) => {
        if (!text || text === 'EMPTY' || text === 'NULL') return null;
        return text;
    };

    // Extrair segmentos únicos
    const uniqueSegments = useMemo(() => {
        const segs = new Set<string>();
        contacts.forEach(c => {
            const s = cleanData(c.segmento);
            if (s) segs.add(s);
        });
        return Array.from(segs).sort();
    }, [contacts]);

    // Função de filtro de data
    const filterByDate = (contact: Contact) => {
        if (!startDate && !endDate) return true;
        const d = new Date(contact.created_at);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
    };

    // Lógica principal de distribuição dos cards
    const boardData = useMemo(() => {
        // Se o modo for SEGMENTO
        if (viewMode === 'segment') {
            const dynamicColumns: Record<string, Contact[]> = {};
            uniqueSegments.forEach(seg => dynamicColumns[seg] = []);
            dynamicColumns['sem_segmento'] = [];

            contacts.forEach(contact => {
                // Filtros (Busca e Data)
                if (searchTerm && !contact.name.toLowerCase().includes(searchTerm.toLowerCase()) && !contact.phone.includes(searchTerm)) return;
                if (!filterByDate(contact)) return;
                
                const seg = cleanData(contact.segmento);

                if (seg && dynamicColumns[seg]) {
                    dynamicColumns[seg].push(contact);
                } else {
                    dynamicColumns['sem_segmento'].push(contact);
                }
            });
            return dynamicColumns;
        }

        // Se o modo for STATUS (Processo de Qualificação)
        const columns: Record<string, Contact[]> = {
            novo: [],
            triagem: [],
            mql: [],
            frio: []
        };

        contacts.forEach(contact => {
            // Filtros (Busca e Data)
            if (searchTerm && !contact.name.toLowerCase().includes(searchTerm.toLowerCase()) && !contact.phone.includes(searchTerm)) return;
            if (!filterByDate(contact)) return;

            const statusLower = (contact.status || '').toLowerCase();
            
            // --- REGRA DE COLUNAS BASEADA ESTRITAMENTE NO STATUS ---
            // A Temperatura (Quente/Frio) NÃO decide a coluna, apenas o Status decide.

            // 1. MQL (Status de Sucesso/Avanço)
            if (
                statusLower.includes('qualificado') ||
                statusLower.includes('agendado') ||
                statusLower.includes('reunião') ||
                statusLower.includes('proposta') ||
                statusLower.includes('ganho') || 
                statusLower.includes('ganha') || 
                statusLower.includes('fechamento')
            ) {
                columns.mql.push(contact);
            }
            // 2. Descarte / Frio (Status de Perda/Desqualificação)
            else if (
                statusLower.includes('desqualificado') ||
                statusLower.includes('perdido') || 
                statusLower.includes('perdi') || 
                statusLower.includes('arquivado') ||
                statusLower.includes('cancelado') ||
                statusLower.includes('sem interesse')
            ) {
                columns.frio.push(contact);
            }
            // 3. Triagem (Em andamento / Conversando)
            else if (
                statusLower.includes('atendimento') || 
                statusLower.includes('andamento') ||
                statusLower.includes('validando') ||
                statusLower.includes('contato') ||
                statusLower.includes('respondeu')
            ) {
                columns.triagem.push(contact);
            }
            // 4. Fallback: Novos (Status 'Novo', vazio, 'EMPTY' ou 'NULL')
            else {
                columns.novo.push(contact);
            }
        });

        return columns;
    }, [contacts, searchTerm, viewMode, uniqueSegments, startDate, endDate]);

    const getTempIcon = (temp?: string) => {
        const t = (temp || '').toLowerCase();
        if (t.includes('quente')) return <Flame size={12} className="text-red-500" />;
        if (t.includes('frio')) return <Snowflake size={12} className="text-blue-300" />;
        if (t.includes('morno')) return <ThermometerSun size={12} className="text-orange-400" />;
        return null;
    };

    const activeColumns = useMemo(() => {
        if (viewMode === 'status') return STATUS_COLUMNS;
        
        const segCols = uniqueSegments.map(seg => ({
            id: seg,
            label: seg,
            color: 'border-af-blue',
            icon: Building2
        }));
        
        segCols.push({
            id: 'sem_segmento',
            label: 'Sem Segmento Identificado',
            color: 'border-gray-600',
            icon: AlertCircle
        });

        return segCols;
    }, [viewMode, uniqueSegments]);

    return (
        <div className="flex flex-col h-full bg-af-black">
            {/* Header / Toolbar */}
            <div className="px-6 py-4 border-b border-gray-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-heading">
                        {viewMode === 'status' ? 'Esteira de Qualificação (MQL)' : 'Mapa de Leads por Segmento'}
                    </h1>
                    <p className="text-xs text-af-gray-200">
                        {viewMode === 'status' 
                            ? 'Organizado pelo STATUS do lead.'
                            : 'Visualização agrupada por vertical de mercado.'}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="bg-[#1E2028] p-1 rounded-lg border border-gray-700 flex shrink-0">
                            <button 
                                onClick={() => setViewMode('status')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'status' ? 'bg-af-blue text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Columns size={14} />
                                Status
                            </button>
                            <button 
                                onClick={() => setViewMode('segment')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'segment' ? 'bg-af-blue text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                            >
                                <LayoutList size={14} />
                                Segmento
                            </button>
                        </div>

                         {/* Date Filter */}
                        <div className="flex items-center gap-2 bg-[#1E2028] p-1 rounded-lg border border-gray-700">
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-transparent text-white text-xs border-none focus:ring-0 w-24 px-1"
                                placeholder="Início"
                            />
                            <span className="text-gray-500 text-xs">-</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-transparent text-white text-xs border-none focus:ring-0 w-24 px-1"
                                placeholder="Fim"
                            />
                            {(startDate || endDate) && (
                                <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-red-500 hover:text-red-400 p-1">
                                    <FilterX size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Busca */}
                    <div className="relative w-full">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar empresa, nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#1E2028] border border-gray-700 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:border-af-blue"
                        />
                    </div>
                </div>
            </div>

            {/* Kanban Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <div className="flex h-full gap-4 min-w-[100%]" style={{ width: 'max-content' }}>
                    {activeColumns.map(col => (
                        <div key={col.id} className="flex-1 flex flex-col h-full w-[300px] bg-[#0A0C14] rounded-xl border border-gray-800 shrink-0">
                            {/* Column Header */}
                            <div className={`p-4 border-b border-gray-800 flex justify-between items-center border-t-4 ${col.color} rounded-t-xl bg-[#0F111A]`}>
                                <div className="flex items-center gap-2">
                                    <col.icon size={16} className="text-gray-400" />
                                    <h3 className="font-bold text-white text-sm uppercase tracking-wide truncate max-w-[180px]" title={col.label}>{col.label}</h3>
                                </div>
                                <span className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">
                                    {boardData[col.id]?.length || 0}
                                </span>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {boardData[col.id]?.length === 0 ? (
                                    <div className="text-center py-10 opacity-30">
                                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 mx-4 flex flex-col items-center">
                                            <p className="text-xs">Vazio</p>
                                        </div>
                                    </div>
                                ) : (
                                    boardData[col.id]?.map(contact => {
                                        const empresaClean = cleanData(contact.empresa);
                                        const segmentoClean = cleanData(contact.segmento);

                                        return (
                                            <div key={contact.id} className="bg-[#1E2028] p-4 rounded-lg border border-gray-700 hover:border-af-blue/50 transition-all shadow-sm group cursor-pointer relative overflow-hidden">
                                                
                                                {/* Badge READY se for MQL */}
                                                {col.id === 'mql' && (
                                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold">
                                                        READY
                                                    </div>
                                                )}

                                                {/* Faixa Lateral baseada na TEMPERATURA (Apenas visual) */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                    (contact.temperatura || '').toLowerCase().includes('quente') ? 'bg-red-500' : 
                                                    (contact.temperatura || '').toLowerCase().includes('morno') ? 'bg-orange-400' : 
                                                    (contact.temperatura || '').toLowerCase().includes('frio') ? 'bg-blue-300' : 'bg-gray-600'
                                                }`} />

                                                <div className="pl-2">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-bold text-white text-sm truncate pr-2">{contact.name}</h4>
                                                        {getTempIcon(contact.temperatura)}
                                                    </div>
                                                    
                                                    {empresaClean && (
                                                        <p className="text-xs text-gray-300 font-medium truncate mb-1">{empresaClean}</p>
                                                    )}

                                                    <p className="text-[10px] text-af-blue font-mono mb-3">{formatPhone(contact.phone)}</p>
                                                    
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {segmentoClean ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-af-blue/10 text-af-blue border border-af-blue/20">
                                                                <Building2 size={10} />
                                                                {segmentoClean}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-500 border border-gray-700 border-dashed">
                                                                Sem Segmento
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-gray-700 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] text-gray-500">
                                                            {new Date(contact.created_at).toLocaleDateString()}
                                                        </span>
                                                        {contact.pipedrive_id ? (
                                                            <span className="text-[10px] text-green-400 flex items-center gap-1">
                                                                <CheckCircle2 size={10} /> Enviado
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                <ArrowRightCircle size={10} /> Ver Chat
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
