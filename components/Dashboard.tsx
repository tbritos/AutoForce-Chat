import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowUpRight, ArrowDownRight, MessageCircle, Users, Activity } from 'lucide-react';
import { Conversation } from '../types';

interface DashboardProps {
  conversations: Conversation[];
}

export const Dashboard: React.FC<DashboardProps> = ({ conversations }) => {
  
  // Calcular Estatísticas Reais
  const stats = useMemo(() => {
    let totalMessages = 0;
    let totalSent = 0;
    let totalReceived = 0;
    let activeChats = conversations.length;
    
    // Agrupamento por Hora para o Gráfico
    const hoursMap = new Map<string, { time: string; sent: number; received: number; order: number }>();
    
    // Inicializar as últimas 24h com zero (ou um range fixo de horas do dia)
    // Para simplificar, vamos pegar as horas existentes nas mensagens
    
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        totalMessages++;
        if (msg.senderId === 'agent') totalSent++;
        else totalReceived++;

        // Processar data para gráfico
        const date = new Date(msg.timestamp);
        const hour = date.getHours().toString().padStart(2, '0') + ':00';
        
        if (!hoursMap.has(hour)) {
            hoursMap.set(hour, { time: hour, sent: 0, received: 0, order: date.getHours() });
        }
        
        const entry = hoursMap.get(hour)!;
        if (msg.senderId === 'agent') entry.sent++;
        else entry.received++;
      });
    });

    // Converter Map para Array e Ordenar por hora
    const chartData = Array.from(hoursMap.values()).sort((a, b) => a.order - b.order);

    return {
        totalMessages,
        totalSent,
        totalReceived,
        activeChats,
        chartData
    };
  }, [conversations]);

  const KPIS = [
    { label: 'Conversas Ativas', value: stats.activeChats, icon: Users, color: 'text-af-blue' },
    { label: 'Total Mensagens', value: stats.totalMessages, icon: MessageCircle, color: 'text-white' },
    { label: 'Enviadas (Agente)', value: stats.totalSent, icon: ArrowUpRight, color: 'text-green-500' },
    { label: 'Recebidas (Cliente)', value: stats.totalReceived, icon: ArrowDownRight, color: 'text-af-orange' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-af-black">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 font-heading">Dashboard de Performance</h1>
        <p className="text-af-gray-200">Visão geral baseada nas conversas carregadas do Supabase.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {KPIS.map((kpi, index) => (
          <div key={index} className="bg-[#0A0C14] p-6 rounded-xl border border-gray-800 hover:border-af-blue/50 transition-colors shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-af-blue/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-af-gray-200 text-sm font-medium uppercase tracking-wide">{kpi.label}</h3>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            
            <div className={`text-4xl font-bold ${kpi.color} font-heading relative z-10`}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white font-heading">Fluxo de Mensagens (por Horário)</h3>
            <span className="text-xs text-af-gray-300 bg-gray-800 px-2 py-1 rounded">Baseado no histórico carregado</span>
          </div>
          <div className="h-80 w-full">
            {stats.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1440FF" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1440FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFA814" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FFA814" stopOpacity={0}/>
                    </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#4E5265" tick={{fill: '#8A92B7'}} />
                    <YAxis stroke="#4E5265" tick={{fill: '#8A92B7'}} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <Tooltip 
                    contentStyle={{ backgroundColor: '#00020A', borderColor: '#4E5265', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="sent" stroke="#1440FF" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" name="Enviadas" />
                    <Area type="monotone" dataKey="received" stroke="#FFA814" strokeWidth={3} fillOpacity={1} fill="url(#colorReceived)" name="Recebidas" />
                </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="w-full h-full flex items-center justify-center flex-col text-af-gray-300">
                    <Activity className="w-10 h-10 mb-2 opacity-50" />
                    <p>Sem dados suficientes para gerar gráfico.</p>
                </div>
            )}
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col justify-between">
           <div>
            <h3 className="text-xl font-bold text-white font-heading mb-6">Plataformas</h3>
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-af-black rounded-lg border border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <MessageCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="font-bold text-white">WhatsApp</p>
                            <p className="text-xs text-af-gray-200">Canal Principal</p>
                        </div>
                    </div>
                    <span className="text-xl font-bold text-white">{stats.activeChats}</span>
                </div>
            </div>
           </div>

           <div className="mt-8">
             <h4 className="text-sm font-bold text-af-gray-200 mb-3 uppercase">Saúde da Conexão</h4>
             <div className="w-full bg-gray-800 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
             </div>
             <p className="text-xs text-right mt-1 text-green-500">Conectado (Realtime)</p>
           </div>
        </div>
      </div>
    </div>
  );
};