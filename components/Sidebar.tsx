import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut, 
  BarChart2,
  Zap
} from 'lucide-react';
import { ViewState } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'live-chat', icon: MessageSquare, label: 'Tempo Real' },
    { id: 'history', icon: Users, label: 'Histórico' },
    { id: 'analytics', icon: BarChart2, label: 'Performance' },
  ];

  return (
    <div className="w-64 bg-af-black border-r border-gray-800 flex flex-col h-full shrink-0">
      <div className="p-6">
        <Logo className="h-8 w-full" />
      </div>

      <div className="flex-1 py-4">
        <p className="px-6 text-xs font-bold text-af-gray-300 uppercase tracking-wider mb-2 font-heading">
          Menu Principal
        </p>
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 group ${
                currentView === item.id
                  ? 'bg-af-blue/10 text-af-blue border-l-4 border-af-blue'
                  : 'text-af-gray-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  currentView === item.id ? 'text-af-blue' : 'text-af-gray-300 group-hover:text-white'
                }`}
              />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-8">
          <p className="px-6 text-xs font-bold text-af-gray-300 uppercase tracking-wider mb-2 font-heading">
            Sistema
          </p>
          <nav className="space-y-1 px-3">
            <button
              onClick={() => onChangeView('settings')}
              className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 group ${
                currentView === 'settings'
                  ? 'bg-af-blue/10 text-af-blue border-l-4 border-af-blue'
                  : 'text-af-gray-200 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings className="mr-3 h-5 w-5 text-af-gray-300 group-hover:text-white" />
              Configurações
            </button>
             <div className="px-3 py-3 mt-4 bg-gradient-to-r from-af-blue-deep to-af-black rounded-lg border border-af-blue/20">
                <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-af-yellow" />
                    <span className="text-xs font-bold text-white uppercase">Status do Agente</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-af-gray-200">n8n Conectado</span>
                </div>
             </div>
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-af-gray-200 hover:text-white transition-colors">
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );
};