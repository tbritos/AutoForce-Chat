import React from 'react';
import { ExternalLink, List } from 'lucide-react';
import { WhatsAppTemplateData } from '../utils';

interface MenuTemplateProps {
  isAgent: boolean;
}

export const MenuTemplate: React.FC<MenuTemplateProps> = ({ isAgent }) => {
  return (
    <div className={`rounded-lg overflow-hidden shadow-md min-w-[280px] max-w-[320px] border ${
      isAgent 
        ? 'bg-af-blue text-white border-af-blue-light' // Estilo Agente: Azul AutoForce
        : 'bg-[#1E2028] text-white border-gray-700' // Estilo Cliente: Dark
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isAgent ? 'bg-black/10 border-white/10' : 'bg-gray-800/50 border-gray-700'}`}>
        <h3 className={`font-bold text-sm ${isAgent ? 'text-white' : 'text-gray-200'}`}>
          Atendimento AutoForce
        </h3>
      </div>

      {/* Body */}
      <div className="px-4 py-4">
        <p className={`text-sm leading-relaxed ${isAgent ? 'text-white' : 'text-gray-300'}`}>
          Olá! 👋 Eu sou a <strong>Lara</strong>, assistente virtual da AutoForce. Para agilizarmos seu contato, escolha uma das opções abaixo:
        </p>
        <p className={`text-[11px] mt-3 ${isAgent ? 'text-blue-200' : 'text-gray-500'}`}>
          Selecione no menu abaixo
        </p>
      </div>

      {/* Button / Footer Interaction */}
      <div className={`border-t ${isAgent ? 'border-white/10' : 'border-gray-700'}`}>
        <button className={`w-full px-4 py-3 flex items-center justify-center gap-2 font-bold text-sm transition-colors ${
            isAgent 
                ? 'text-white hover:bg-white/10' 
                : 'text-af-blue hover:bg-white/5'
        }`}>
          <List size={16} />
          Ver opções
        </button>
      </div>
    </div>
  );
};

interface WhatsAppTemplateMessageProps {
  isAgent: boolean;
  template: WhatsAppTemplateData;
}

export const WhatsAppTemplateMessage: React.FC<WhatsAppTemplateMessageProps> = ({ isAgent, template }) => {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-md min-w-[300px] max-w-[420px] border ${
      isAgent
        ? 'bg-af-blue text-white border-af-blue-light rounded-tr-none'
        : 'bg-[#1E2028] text-white border-gray-700 rounded-tl-none'
    }`}>
      {template.header && (
        <div className={`px-4 py-3 border-b ${isAgent ? 'bg-black/10 border-white/10' : 'bg-gray-800/50 border-gray-700'}`}>
          <h3 className="font-bold text-sm">{template.header}</h3>
        </div>
      )}

      {template.body && (
        <div className="px-4 py-3">
          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isAgent ? 'text-white' : 'text-gray-200'}`}>
            {template.body}
          </p>
        </div>
      )}

      {template.buttons.length > 0 && (
        <div className={`border-t ${isAgent ? 'border-white/10' : 'border-gray-700'}`}>
          {template.buttons.map((button, index) => {
            const isUrl = button.type === 'URL' && !!button.url;
            return (
              <button
                key={`${button.text}-${index}`}
                type="button"
                className={`w-full px-4 py-3 flex items-center justify-center gap-2 text-sm font-semibold transition-colors border-b last:border-b-0 ${
                  isAgent
                    ? 'border-white/10 text-white hover:bg-white/10'
                    : 'border-gray-700 text-af-blue hover:bg-white/5'
                }`}
                onClick={() => {
                  if (isUrl && button.url) window.open(button.url, '_blank', 'noopener,noreferrer');
                }}
              >
                {isUrl ? <ExternalLink size={15} /> : <List size={15} />}
                <span>{button.text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
