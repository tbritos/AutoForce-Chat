import React from 'react';
import { List, ChevronRight } from 'lucide-react';

interface MenuTemplateProps {
  isAgent: boolean;
}

export const MenuTemplate: React.FC<MenuTemplateProps> = ({ isAgent }) => {
  return (
    <div className={`rounded-lg overflow-hidden shadow-sm min-w-[280px] max-w-[320px] ${
      isAgent 
        ? 'bg-white text-gray-800' // Menu enviado pelo agente (geralmente visual claro ou destacado)
        : 'bg-[#1E2028] text-white'
    }`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <h3 className="font-bold text-sm text-gray-800">Atendimento AutoForce</h3>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed text-gray-700">
          Olá! 👋 Eu sou a <strong>Lara</strong>, assistente virtual da AutoForce. Para agilizarmos seu contato, escolha uma das opções abaixo:
        </p>
        <p className="text-[11px] text-gray-400 mt-2">
          Selecione no menu abaixo
        </p>
      </div>

      {/* Button / Footer Interaction */}
      <div className="border-t border-gray-100">
        <button className="w-full px-4 py-3 flex items-center justify-center gap-2 text-af-blue font-bold text-sm hover:bg-gray-50 transition-colors">
          <List size={16} />
          Ver opções
        </button>
      </div>
    </div>
  );
};
