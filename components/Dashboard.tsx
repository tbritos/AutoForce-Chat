import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { KPIS } from '../constants';
import { ArrowUpRight, ArrowDownRight, Clock, Users, MessageCircle } from 'lucide-react';

const data = [
  { name: '08:00', chats: 12, leads: 4 },
  { name: '10:00', chats: 19, leads: 8 },
  { name: '12:00', chats: 35, leads: 15 },
  { name: '14:00', chats: 28, leads: 12 },
  { name: '16:00', chats: 42, leads: 20 },
  { name: '18:00', chats: 30, leads: 14 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="p-8 h-full overflow-y-auto bg-af-black">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 font-heading">Dashboard de Performance</h1>
        <p className="text-af-gray-200">Acompanhe em tempo real os indicadores do seu agente n8n.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {KPIS.map((kpi, index) => (
          <div key={index} className="bg-[#0A0C14] p-6 rounded-xl border border-gray-800 hover:border-af-blue/50 transition-colors shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-af-blue/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h3 className="text-af-gray-200 text-sm font-medium uppercase tracking-wide">{kpi.label}</h3>
              {kpi.change.startsWith('+') ? (
                <span className="flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">
                  {kpi.change} <ArrowUpRight className="ml-1 w-3 h-3" />
                </span>
              ) : (
                <span className="flex items-center text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                  {kpi.change} <ArrowDownRight className="ml-1 w-3 h-3" />
                </span>
              )}
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
            <h3 className="text-xl font-bold text-white font-heading">Volume de Atendimentos</h3>
            <select className="bg-af-black border border-gray-700 text-af-gray-200 text-sm rounded-lg p-2 focus:ring-af-blue focus:border-af-blue">
              <option>Hoje</option>
              <option>Últimos 7 dias</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1440FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1440FF" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFA814" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFA814" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#4E5265" tick={{fill: '#8A92B7'}} />
                <YAxis stroke="#4E5265" tick={{fill: '#8A92B7'}} />
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#00020A', borderColor: '#4E5265', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area type="monotone" dataKey="chats" stroke="#1440FF" strokeWidth={3} fillOpacity={1} fill="url(#colorChats)" name="Atendimentos" />
                <Area type="monotone" dataKey="leads" stroke="#FFA814" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" name="Leads Qualificados" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="bg-[#0A0C14] p-6 rounded-xl border border-gray-800 shadow-lg flex flex-col justify-between">
           <div>
            <h3 className="text-xl font-bold text-white font-heading mb-6">Canais</h3>
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-af-black rounded-lg border border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <MessageCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="font-bold text-white">WhatsApp</p>
                            <p className="text-xs text-af-gray-200">85% do tráfego</p>
                        </div>
                    </div>
                    <span className="text-xl font-bold text-white">218</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-af-black rounded-lg border border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg">
                            <Users className="w-6 h-6 text-pink-500" />
                        </div>
                        <div>
                            <p className="font-bold text-white">Instagram</p>
                            <p className="text-xs text-af-gray-200">12% do tráfego</p>
                        </div>
                    </div>
                    <span className="text-xl font-bold text-white">45</span>
                </div>
            </div>
           </div>

           <div className="mt-8">
             <h4 className="text-sm font-bold text-af-gray-200 mb-3 uppercase">Status do Sistema</h4>
             <div className="w-full bg-gray-800 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-af-blue h-2.5 rounded-full" style={{ width: '92%' }}></div>
             </div>
             <p className="text-xs text-right mt-1 text-af-blue">92% de Capacidade</p>
           </div>
        </div>
      </div>
    </div>
  );
};