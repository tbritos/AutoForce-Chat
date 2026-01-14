import React, { useState, useEffect } from 'react';
import { Save, Database, ShieldCheck, AlertCircle } from 'lucide-react';
import { SystemConfig } from '../types';

interface SettingsProps {
  config: SystemConfig;
  onSave: (config: SystemConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  const [formData, setFormData] = useState<SystemConfig>({
    supabaseUrl: '',
    supabaseKey: ''
  });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.supabaseUrl && formData.supabaseKey) {
      onSave(formData);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-af-black flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 font-heading">Configurações do Sistema</h1>
          <p className="text-af-gray-200">Conecte sua base de dados Supabase para ativar o monitoramento em tempo real.</p>
        </header>

        <div className="bg-[#0A0C14] border border-gray-800 rounded-xl p-8 shadow-2xl relative overflow-hidden">
           {/* Decorative Background */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-af-blue/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            
            {/* URL Input */}
            <div>
              <label className="block text-sm font-bold text-af-gray-200 mb-2 flex items-center gap-2">
                <Database size={16} className="text-af-blue" />
                Supabase Project URL
              </label>
              <input
                type="text"
                value={formData.supabaseUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                placeholder="https://seu-projeto.supabase.co"
                className="w-full bg-[#1E2028] border border-gray-700 text-white rounded-lg px-4 py-3 focus:border-af-blue focus:ring-1 focus:ring-af-blue transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                Encontrado em: Project Settings {'>'} API {'>'} Project URL
              </p>
            </div>

            {/* Key Input */}
            <div>
              <label className="block text-sm font-bold text-af-gray-200 mb-2 flex items-center gap-2">
                <ShieldCheck size={16} className="text-af-blue" />
                Supabase API Key (anon/public)
              </label>
              <input
                type="password"
                value={formData.supabaseKey}
                onChange={(e) => setFormData(prev => ({ ...prev, supabaseKey: e.target.value }))}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-[#1E2028] border border-gray-700 text-white rounded-lg px-4 py-3 focus:border-af-blue focus:ring-1 focus:ring-af-blue transition-all font-mono text-sm"
              />
               <p className="text-xs text-gray-500 mt-2">
                Encontrado em: Project Settings {'>'} API {'>'} Project API keys {'>'} anon public
              </p>
            </div>

            {/* Status Message */}
            {status === 'success' && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold">
                <ShieldCheck size={18} />
                Configurações salvas com sucesso! Conectando...
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-bold">
                <AlertCircle size={18} />
                Por favor, preencha todos os campos.
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-af-blue hover:bg-af-blue-dark text-white font-bold py-4 rounded-lg shadow-lg shadow-af-blue/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
              >
                <Save size={20} />
                Salvar e Conectar
              </button>
            </div>

          </form>
        </div>
        
        <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
                Seus dados são salvos apenas no navegador local.
            </p>
        </div>
      </div>
    </div>
  );
};