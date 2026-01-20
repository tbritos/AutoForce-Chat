import React, { useState } from 'react';
import { Contact } from '../types';
import { formatPhone } from '../utils';
import { Search, Download, Building2, Flame, Snowflake, ThermometerSun, AlertCircle, Calendar } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
}

export const ContactList: React.FC<ContactListProps> = ({ contacts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm) ||
    (c.empresa && c.empresa.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTempBadge = (temp?: string) => {
    const t = (temp || '').toLowerCase();
    if (t.includes('quente')) {
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20"><Flame size={10} /> Quente</span>;
    }
    if (t.includes('frio')) {
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20"><Snowflake size={10} /> Frio</span>;
    }
    if (t.includes('morno')) {
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20"><ThermometerSun size={10} /> Morno</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-gray-800 text-gray-400 border border-gray-700">-</span>;
  };

  return (
    <div className="flex flex-col h-full bg-af-black">
      {/* Header */}
      <div className="p-8 border-b border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 font-heading">Base de Leads</h1>
            <p className="text-af-gray-200">Gerenciamento tabular de todos os contatos capturados pela IA.</p>
          </div>
          <button className="flex items-center gap-2 bg-[#1E2028] hover:bg-[#2a2d38] text-white px-4 py-2.5 rounded-lg border border-gray-700 transition-colors">
            <Download size={16} />
            <span className="text-sm font-bold">Exportar CSV</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nome, telefone ou empresa..." 
            className="w-full bg-[#0A0C14] border border-gray-700 text-white text-sm rounded-lg pl-9 pr-4 py-3 focus:border-af-blue focus:ring-1 focus:ring-af-blue transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-[#0A0C14] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#15171e] border-b border-gray-800">
                <th className="p-4 text-xs font-bold text-af-gray-300 uppercase tracking-wider">Lead / Contato</th>
                <th className="p-4 text-xs font-bold text-af-gray-300 uppercase tracking-wider">Empresa / Segmento</th>
                <th className="p-4 text-xs font-bold text-af-gray-300 uppercase tracking-wider">Qualificação</th>
                <th className="p-4 text-xs font-bold text-af-gray-300 uppercase tracking-wider">Status Atual</th>
                <th className="p-4 text-xs font-bold text-af-gray-300 uppercase tracking-wider">Data Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white border border-gray-600">
                           {contact.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{contact.name}</p>
                          <p className="text-xs text-af-blue font-mono">{formatPhone(contact.phone)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-300 font-medium flex items-center gap-1">
                           <Building2 size={12} className="text-gray-500"/>
                           {contact.empresa || <span className="text-gray-600 italic">Não informado</span>}
                        </p>
                        {contact.segmento && (
                            <span className="inline-block text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">
                                {contact.segmento}
                            </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {getTempBadge(contact.temperatura)}
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-300">{contact.status || 'Novo'}</span>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar size={12} />
                            {new Date(contact.created_at).toLocaleDateString()}
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Nenhum lead encontrado com os filtros atuais.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right text-xs text-gray-500">
            Mostrando {filteredContacts.length} leads
        </div>
      </div>
    </div>
  );
};
