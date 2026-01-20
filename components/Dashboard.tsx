import React, { useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
    PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, Building2, BrainCircuit, Target } from 'lucide-react';
import { Conversation, Contact } from '../types';

interface DashboardProps {
  conversations: Conversation[];
  contacts: Contact[];
}

export const Dashboard: React.FC<DashboardProps> = ({ conversations, contacts }) => {
  
  // Calcular Estatísticas
  const stats = useMemo(() => {
    let mqlCount = 0;
    
    // --- 1. Dados de Segmentação (CRM) ---
    const segmentMap = new Map<string, number>();
    contacts.forEach(c => {
        const seg = c.segmento || 'Não Identificado';
        segmentMap.set(seg, (segmentMap.get(seg) || 0) + 1);

        // Contagem de MQLs (Temperatura Quente)
        if (c.temperatura?.toLowerCase().includes('quente')) {
            mqlCount++;
        }
    });
    
    const COLORS = ['#1440FF', '#FFA814', '#00C49F', '#FF8042', '#8A92B7', '#FF1440'];
    const segmentChartData = Array.from(segmentMap.entries())
        .map(([name, value], index) => ({
            name,
            value,
            color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value); // Ordena por maior volume

    // --- 2. Dados de Qualificação (Funil) ---
    const funnelData = [
        { name: 'Total Leads', value: contacts.length, fill: '#3b82f6' },
        { name: 'Em Triagem', value: contacts.filter(c => !c.temperatura || c.temperatura === 'Morno').length, fill: '#f59e0b' },
        { name: 'MQLs (Quente)', value: mqlCount, fill: '#10b981' },
        { name: 'Descarte', value: contacts.filter(c => c.temperatura === 'Frio').length, fill: '#ef4444' }
    ];

    // --- 3. Mensagens (Volume de Atendimento) ---
    // Apenas para mostrar atividade da IA
    let totalMessages = 0;
    const hoursMap = new Map<string, number>();
    conversations.forEach(conv => {
        totalMessages += conv.messages.length;
        conv.messages.forEach(msg => {
            const hour = new Date(msg.timestamp).getHours().toString().padStart(2, '0') + 'h';
            hoursMap.set(hour, (hoursMap.get(hour) || 0) + 1);
        });
    });
    const activityData = Array.from(hoursMap.entries())
        .map(([time, value]) => ({ time, value }))
        .sort((a, b) => a.time.localeCompare(b.time));

    return {
        totalLeads: contacts.length,
        mqlCount,
        conversionRate: contacts.length > 0 ? ((mqlCount / contacts.length) * 100).toFixed(1) : '0',
        segmentChartData,
        funnelData,
        activityData,
        totalMessages
    };
  }, [conversations, contacts]);

  const KPIS = [
    { label: 'Total de Leads', value: stats.totalLeads, icon: Users, color: 'text-white' },
    { label: 'MQLs Gerados', value: stats.mqlCount, icon: Target, color: 'text-green-500' },
    { label: 'Taxa Conversão', value: `${stats.conversionRate}%`, icon: BrainCircuit, color: 'text-af-blue' },
    { label: 'Segmentos Ativos', value: stats.segmentChartData.filter(s => s.name !== 'Não Identificado').length, icon: Building2, color: 'text-af-orange' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-af-black custom-scrollbar">
      <header className="mb-8 border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2 font-heading">Marketing Intelligence</h1>
        <p className="text-af-gray-200">Acompanhe a performance da IA na qualificação e geração de MQLs.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {KPIS.map((kpi, index) => (
          <div key={index} className="bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg flex items-center justify-between">
            <div>
                <p className="text-af-gray-200 text-xs font-bold uppercase tracking-wide mb-1">{kpi.label}</p>
                <p className={`text-3xl font-bold ${kpi.color} font-heading`}>{kpi.value}</p>
            </div>
            <div className={`p-3 rounded-lg bg-gray-900 border border-gray-800 ${kpi.color}`}>
                <kpi.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Gráfico de Pizza: Segmentação (MUITO IMPORTANTE PARA O USUÁRIO) */}
        <div className="lg:col-span-1 bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col">
            <h3 className="text-lg font-bold text-white font-heading mb-1">Share por Segmento</h3>
            <p className="text-xs text-gray-500 mb-4">Distribuição da base de leads por vertical.</p>
            
            <div className="flex-1 min-h-[250px] relative">
                {stats.segmentChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.segmentChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {stats.segmentChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#00020A', borderColor: '#4E5265', borderRadius: '8px' }} itemStyle={{color: '#fff'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px'}} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-600 text-xs">Sem dados</div>
                )}
            </div>
        </div>

        {/* Gráfico de Barras: Funil de Qualificação */}
        <div className="lg:col-span-2 bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg">
            <h3 className="text-lg font-bold text-white font-heading mb-1">Funil de Qualificação IA</h3>
            <p className="text-xs text-gray-500 mb-6">Volume de leads em cada etapa do processo automático.</p>
            
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1f2937" />
                        <XAxis type="number" stroke="#4E5265" hide />
                        <YAxis dataKey="name" type="category" stroke="#8A92B7" width={100} tick={{fill: '#fff', fontSize: 12}} />
                        <Tooltip 
                            cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                            contentStyle={{ backgroundColor: '#00020A', borderColor: '#4E5265', color: '#fff' }} 
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                            {stats.funnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

       {/* Atividade da IA */}
       <div className="bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white font-heading">Volumetria de Interações</h3>
                    <p className="text-xs text-gray-500">Horários de pico de atendimento da Inteligência Artificial.</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-af-blue">{stats.totalMessages}</span>
                    <span className="text-xs text-gray-500 block">Mensagens processadas</span>
                </div>
            </div>
            
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.activityData}>
                        <defs>
                            <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1440FF" stopOpacity={0.5}/>
                                <stop offset="95%" stopColor="#1440FF" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="#4E5265" tick={{fill: '#8A92B7', fontSize: 10}} />
                        <Tooltip contentStyle={{ backgroundColor: '#00020A', borderColor: '#4E5265' }} itemStyle={{color: '#fff'}} />
                        <Area type="monotone" dataKey="value" stroke="#1440FF" fillOpacity={1} fill="url(#colorActivity)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
       </div>
    </div>
  );
};
