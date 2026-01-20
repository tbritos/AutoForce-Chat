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
    BrainCircuit
} from 'lucide-react';
import { formatPhone } from '../utils';

interface CRMBoardProps {
    contacts: Contact[];
}

// Configuração das Colunas de QUALIFICAÇÃO (Foco em Marketing/SDR)
const STATUS_COLUMNS = [
    { id: 'novo', label: 'Novos / Sem Dados', color: 'border-gray-500', icon: AlertCircle },
    { id: 'triagem', label: 'Em Triagem (IA)', color: 'border-blue-500', icon: BrainCircuit },
    { id: 'mql', label: 'MQL (Pronto p/ Vendas)', color: 'border-green-500', icon: CheckCircle2 }, // O "pote de ouro" do marketing
    { id: 'frio', label: 'Descarte / Nutrição', color: 'border-slate-700', icon: Snowflake },
];

export const CRMBoard: React.FC<CRMBoardProps> = ({ contacts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'status' | 'segment'>('status'); // Toggle de Visão

    // Extrair segmentos únicos
    const uniqueSegments = useMemo(() => {
        const segs = new Set<string>();
        contacts.forEach(c => {
            if (c.segmento) segs.add(c.segmento);
        });
        return Array.from(segs).sort();
    }, [contacts]);

    // Lógica principal de distribuição dos cards
    const boardData = useMemo(() => {
        // Se o modo for SEGMENTO, as colunas são os próprios segmentos
        if (viewMode === 'segment') {
            const dynamicColumns: Record<string, Contact[]> = {};
            
            // Inicializa colunas baseadas nos segmentos existentes + "Sem Segmento"
            uniqueSegments.forEach(seg => dynamicColumns[seg] = []);
            dynamicColumns['sem_segmento'] = [];

            contacts.forEach(contact => {
                if (searchTerm && !contact.name.toLowerCase().includes(searchTerm.toLowerCase()) && !contact.phone.includes(searchTerm)) return;
                
                if (contact.segmento && dynamicColumns[contact.segmento]) {
                    dynamicColumns[contact.segmento].push(contact);
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
            if (searchTerm && !contact.name.toLowerCase().includes(searchTerm.toLowerCase()) && !contact.phone.includes(searchTerm)) return;

            const statusLower = (contact.status || '').toLowerCase();
            const tempLower = (contact.temperatura || '').toLowerCase();

            // Lógica de Marketing (MQL vs Lixo vs Triagem)
            
            // 1. MQL: Temperatura Quente ou Status de Sucesso
            if (tempLower.includes('quente') || statusLower.includes('proposta') || statusLower.includes('ganho') || statusLower.includes('agendado')) {
                columns.mql.push(contact);
            } 
            // 2. Frio/Descarte
            else if (tempLower.includes('frio') || statusLower.includes('perdi') || statusLower.includes('arquivado')) {
                columns.frio.push(contact);
            }
            // 3. Em Triagem: IA conversando, temperatura morna ou status de atendimento
            else if (statusLower.includes('atendimento') || tempLower.includes('morno') || contact.segmento || contact.cargo) {
                // Se já tem algum dado enriquecido (segmento/cargo) mas não é quente nem frio, ainda tá em triagem
                columns.triagem.push(contact);
            }
            // 4. Novo: Sem dados relevantes
            else {
                columns.novo.push(contact);
            }
        });

        return columns;
    }, [contacts, searchTerm, viewMode, uniqueSegments]);

    const getTempIcon = (temp?: string) => {
        const t = (temp || '').toLowerCase();
        if (t.includes('quente')) return <Flame size={12} className="text-red-500" />;
        if (t.includes('frio')) return <Snowflake size={12} className="text-blue-300" />;
        if (t.includes('morno')) return <ThermometerSun size={12} className="text-orange-400" />;
        return null;
    };

    // Gera as colunas dinamicamente baseado no modo de visualização
    const activeColumns = useMemo(() => {
        if (viewMode === 'status') return STATUS_COLUMNS;
        
        // Colunas de Segmento
        const segCols = uniqueSegments.map(seg => ({
            id: seg,
            label: seg,
            color: 'border-af-blue', // Cor padrão para segmentos
            icon: Building2
        }));
        
        // Adiciona coluna de "Sem Segmento" no final
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
                            ? 'Acompanhe a triagem da IA até a entrega para vendas.'
                            : 'Visualização agrupada por vertical de mercado.'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="bg-[#1E2028] p-1 rounded-lg border border-gray-700 flex">
                        <button 
                            onClick={() => setViewMode('status')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'status' ? 'bg-af-blue text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Columns size={14} />
                            Processo
                        </button>
                        <button 
                            onClick={() => setViewMode('segment')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'segment' ? 'bg-af-blue text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            <LayoutList size={14} />
                            Por Segmento
                        </button>
                    </div>

                    {/* Busca */}
                    <div className="relative w-full sm:w-64">
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
                                    boardData[col.id]?.map(contact => (
                                        <div key={contact.id} className="bg-[#1E2028] p-4 rounded-lg border border-gray-700 hover:border-af-blue/50 transition-all shadow-sm group cursor-pointer relative overflow-hidden">
                                            
                                            {/* Tag de MQL Highlight */}
                                            {col.id === 'mql' && (
                                                <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold">
                                                    READY
                                                </div>
                                            )}

                                            {/* Temperatura Lateral Visual */}
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
                                                
                                                {contact.empresa && (
                                                    <p className="text-xs text-gray-300 font-medium truncate mb-1">{contact.empresa}</p>
                                                )}

                                                <p className="text-[10px] text-af-blue font-mono mb-3">{formatPhone(contact.phone)}</p>
                                                
                                                {/* Tags de Enriquecimento */}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {contact.segmento ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-af-blue/10 text-af-blue border border-af-blue/20">
                                                            <Building2 size={10} />
                                                            {contact.segmento}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-500 border border-gray-700 border-dashed">
                                                            Sem Segmento
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Botão de Ação Rápida (Simulação) */}
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