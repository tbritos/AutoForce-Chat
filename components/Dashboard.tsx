import React, { useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
    PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, MessageCircle, Users, Activity, Building2, Store } from 'lucide-react';
import { Conversation, Contact } from '../types';

interface DashboardProps {
  conversations: Conversation[];
  contacts: Contact[];
}

export const Dashboard: React.FC<DashboardProps> = ({ conversations, contacts }) => {
  
  // Calcular Estatísticas
  const stats = useMemo(() => {
    let totalMessages = 0;
    let totalSent = 0;
    let totalReceived = 0;
    let activeChats = conversations.length;
    
    // --- 1. Dados de Mensagens (Time Series) ---
    const hoursMap = new Map<string, { time: string; sent: number; received: number; order: number }>();
    
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        totalMessages++;
        if (msg.senderId === 'agent') totalSent++;
        else totalReceived++;

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

    const messageChartData = Array.from(hoursMap.values()).sort((a, b) => a.order - b.order);

    // --- 2. Dados de Segmentação (CRM) ---
    const segmentMap = new Map<string, number>();
    contacts.forEach(c => {
        const seg = c.segmento || 'Não classificado';
        segmentMap.set(seg, (segmentMap.get(seg) || 0) + 1);
    });
    
    // Prepara dados para gráfico de Pizza
    const COLORS = ['#1440FF', '#FFA814', '#00C49F', '#FF8042', '#8A92B7'];
    const segmentChartData = Array.from(segmentMap.entries()).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
    }));

    // --- 3. Dados de Temperatura/Qualificação ---
    const tempMap = new Map<string, number>();
    contacts.forEach(c => {
        const temp = c.temperatura || 'N/A';
        tempMap.set(temp, (tempMap.get(temp) || 0) + 1);
    });

    const tempChartData = Array.from(tempMap.entries()).map(([name, value]) => ({
        name,
        value
    }));

    return {
        totalMessages,
        totalSent,
        totalReceived,
        activeChats,
        totalLeads: contacts.length,
        messageChartData,
        segmentChartData,
        tempChartData
    };
  }, [conversations, contacts]);

  const KPIS = [
    { label: 'Leads na Base', value: stats.totalLeads, icon: Users, color: 'text-af-blue' },
    { label: 'Segmentos Identif.', value: stats.segmentChartData.length, icon: Building2, color: 'text-white' },
    { label: 'Msgs Enviadas', value: stats.totalSent, icon: ArrowUpRight, color: 'text-green-500' },
    { label: 'Msgs Recebidas', value: stats.totalReceived, icon: ArrowDownRight, color: 'text-af-orange' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto bg-af-black custom-scrollbar">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 font-heading">Dashboard Gerencial</h1>
        <p className="text-af-gray-200">Visão unificada de performance de atendimento e qualidade da base (CRM).</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Main Chart: Messages */}
        <div className="lg:col-span-2 bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white font-heading">Fluxo de Atendimento (Hoje)</h3>
          </div>
          <div className="h-80 w-full">
            {stats.messageChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.messageChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                    <p>Sem dados de mensagens para gerar gráfico.</p>
                </div>
            )}
          </div>
        </div>

        {/* Secondary Chart: Segments */}
        <div className="bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col">
            <h3 className="text-xl font-bold text-white font-heading mb-4">Leads por Segmento</h3>
            <div className="flex-1 min-h-[250px]">
                {stats.segmentChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.segmentChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.segmentChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#00020A', borderColor: '#4E5265', borderRadius: '8px' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <Building2 className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm">Sem dados de segmento</span>
                    </div>
                )}
            </div>
        </div>
      </div>

       {/* Tertiary Row: Temperature & Quality */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg">
                <h3 className="text-xl font-bold text-white font-heading mb-6">Temperatura dos Leads</h3>
                <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.tempChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1f2937" />
                            <XAxis type="number" stroke="#4E5265" hide />
                            <YAxis dataKey="name" type="category" stroke="#8A92B7" width={100} tick={{fill: '#fff', fontSize: 12}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#00020A', borderColor: '#4E5265' }} />
                            <Bar dataKey="value" fill="#1440FF" radius={[0, 4, 4, 0]} barSize={20} name="Quantidade" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col justify-center items-center text-center">
                 <Store className="w-16 h-16 text-af-blue mb-4 opacity-20" />
                 <h3 className="text-2xl font-bold text-white font-heading">Gestão Completa</h3>
                 <p className="text-af-gray-200 mt-2 max-w-sm">
                    Utilize o Pipeline CRM no menu lateral para gerenciar cada lead individualmente e mover cards entre as etapas.
                 </p>
            </div>
       </div>
    </div>
  );
};
