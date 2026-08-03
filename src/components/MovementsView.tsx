import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  RotateCcw,
  Search,
  Filter,
  Download,
  Calendar,
  Building,
  User as UserIcon,
  FileText,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { MovementType, StockMovement, WorkPhase, WorkSite, isGlobalWorksiteRole, canCreateOrEditMovements } from '../types';
import type { User } from '../types';

interface MovementsViewProps {
  movements: StockMovement[];
  worksites: WorkSite[];
  currentUser?: User | null;
  onOpenNewMovement: () => void;
  onEditMovement: (movement: StockMovement) => void;
  onDeleteMovement: (id: string) => void;
}

const WORK_PHASES: WorkPhase[] = [
  'Fundação',
  'Estrutura / Concretagem',
  'Alvenaria / Vedação',
  'Instalações Hidráulicas',
  'Instalações Elétricas',
  'Cobertura e Telhado',
  'Revestimento e Piso',
  'Pintura e Acabamento',
  'Limpeza e Manutenção',
];

export const MovementsView: React.FC<MovementsViewProps> = ({
  movements,
  worksites,
  currentUser,
  onOpenNewMovement,
  onEditMovement,
  onDeleteMovement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MovementType>('ALL');
  const [selectedWorksite, setSelectedWorksite] = useState<string>('ALL');
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');

  const isGlobalUser = isGlobalWorksiteRole(currentUser?.role);

  const filteredMovements = movements.filter((mov) => {
    const matchesSearch =
      mov.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.responsible.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mov.invoiceNumber && mov.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (mov.notes && mov.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || mov.type === typeFilter;
    const matchesWorksite = selectedWorksite === 'ALL' || mov.workSiteId === selectedWorksite;
    const matchesPhase = selectedPhase === 'ALL' || mov.workPhase === selectedPhase;

    return matchesSearch && matchesType && matchesWorksite && matchesPhase;
  });

  // Calculate totals
  const totalEntradas = movements
    .filter((m) => m.type === 'ENTRADA')
    .reduce((acc, m) => acc + (m.totalPrice || 0), 0);

  const totalSaidas = movements
    .filter((m) => m.type === 'SAIDA')
    .reduce((acc, m) => acc + (m.totalPrice || 0), 0);

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Insumo', 'Quantidade', 'Unidade', 'Valor Total', 'Obra', 'Etapa', 'NF-e', 'Responsável'];
    const rows = filteredMovements.map((m) => [
      m.date,
      m.type,
      `"${m.materialName}"`,
      m.quantity,
      m.unit,
      m.totalPrice ? m.totalPrice.toFixed(2) : '0.00',
      `"${m.workSiteName || ''}"`,
      `"${m.workPhase || ''}"`,
      `"${m.invoiceNumber || ''}"`,
      `"${m.responsible}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `movimentacoes-estoque-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Global Access Role Banner */}
      {isGlobalUser && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Monitoramento Global de Movimentações:</span> Como{' '}
              <span className="text-emerald-400 font-semibold">{currentUser?.role}</span>, você possui acesso ao histórico consolidado de entradas e saídas de todos os canteiros.
            </div>
          </div>
          <span className="bg-emerald-900/60 border border-emerald-500/40 font-mono text-[10px] font-bold px-2 py-1 rounded-lg shrink-0">
            VISÃO GLOBAL
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Histórico e Registro de Movimentações
          </h2>
          <p className="text-xs text-[#888888] mt-0.5">
            Rastreabilidade completa de recebimentos (NF-e), saídas para canteiros de obras e perdas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 border border-[#1F1F21] bg-[#151517] rounded-xl text-[#E0E0E0] hover:text-white hover:bg-[#1F1F21] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          {canCreateOrEditMovements(currentUser?.role) ? (
            <button
              onClick={onOpenNewMovement}
              className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Lançar Movimentação
            </button>
          ) : (
            <span className="bg-[#151517] border border-[#222226] text-[#888888] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Somente Leitura ({currentUser?.role || 'Consulta'})
            </span>
          )}
        </div>
      </div>

      {/* Financial Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0F0F11] p-4 rounded-xl border border-[#1F1F21] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#888888] font-medium">Entradas Registradas</span>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
              {totalEntradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
          <div className="p-2.5 bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0F0F11] p-4 rounded-xl border border-[#1F1F21] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#888888] font-medium">Insumos Alocados em Obras</span>
            <div className="text-xl font-mono font-bold text-[#F2A30F] mt-0.5">
              {totalSaidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
          <div className="p-2.5 bg-amber-950/30 text-[#F2A30F] border border-amber-500/20 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0F0F11] p-4 rounded-xl border border-[#1F1F21] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#888888] font-medium">Total de Registros</span>
            <div className="text-xl font-mono font-bold text-white mt-0.5">
              {movements.length} <span className="text-xs font-sans font-normal text-[#666666]">lançamentos</span>
            </div>
          </div>
          <div className="p-2.5 bg-blue-950/30 text-blue-400 border border-blue-500/20 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0F0F11] rounded-xl border border-[#1F1F21] p-4 space-y-3 shadow-sm text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por insumo, NF, responsável..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl pl-9 pr-3 py-2 text-white placeholder-[#666666] focus:border-[#F2A30F] outline-none"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2 text-white focus:border-[#F2A30F] outline-none"
            >
              <option value="ALL">Todos os Tipos</option>
              <option value="ENTRADA">📥 Entradas (Recebimento / Compras)</option>
              <option value="SAIDA">📤 Saídas (Alocação para Obra)</option>
              <option value="AJUSTE">🔄 Perdas / Ajustes de Canteiro</option>
              <option value="DEVOLUCAO">↩️ Devoluções de Sobra</option>
            </select>
          </div>

          {/* Worksite Filter */}
          <div>
            <select
              value={selectedWorksite}
              onChange={(e) => setSelectedWorksite(e.target.value)}
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2 text-white focus:border-[#F2A30F] outline-none"
            >
              <option value="ALL">Todas as Obras / Canteiros</option>
              {worksites.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phase Filter */}
          <div>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2 text-white focus:border-[#F2A30F] outline-none"
            >
              <option value="ALL">Todas as Etapas da Obra</option>
              {WORK_PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#151517] text-[#A0A0A0] border-b border-[#1F1F21] font-semibold uppercase text-[11px] tracking-wider">
                <th className="p-3.5">Data / Hora</th>
                <th className="p-3.5">Tipo</th>
                <th className="p-3.5">Insumo</th>
                <th className="p-3.5 text-right">Qtd Movimentada</th>
                <th className="p-3.5 text-right">Valor Total (R$)</th>
                <th className="p-3.5">Obra / Destino</th>
                <th className="p-3.5">Etapa da Obra</th>
                <th className="p-3.5">NF-e / Responsável</th>
                <th className="p-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F21] text-[#E0E0E0]">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#666666]">
                    Nenhuma movimentação registrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  return (
                    <tr key={mov.id} className="hover:bg-[#151517] transition-colors">
                      <td className="p-3 text-[#888888] whitespace-nowrap font-mono">{mov.date}</td>
                      <td className="p-3 whitespace-nowrap">
                        {mov.type === 'ENTRADA' && (
                          <span className="inline-flex items-center gap-1 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            <ArrowDownRight className="w-3 h-3" /> ENTRADA
                          </span>
                        )}
                        {mov.type === 'SAIDA' && (
                          <span className="inline-flex items-center gap-1 bg-amber-950/50 border border-amber-500/30 text-[#F2A30F] font-bold px-2 py-0.5 rounded-full text-[10px]">
                            <ArrowUpRight className="w-3 h-3" /> SAÍDA OBRA
                          </span>
                        )}
                        {mov.type === 'AJUSTE' && (
                          <span className="inline-flex items-center gap-1 bg-blue-950/50 border border-blue-500/30 text-blue-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            <RefreshCw className="w-3 h-3" /> AJUSTE / PERDA
                          </span>
                        )}
                        {mov.type === 'DEVOLUCAO' && (
                          <span className="inline-flex items-center gap-1 bg-purple-950/50 border border-purple-500/30 text-purple-400 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            <RotateCcw className="w-3 h-3" /> DEVOLUÇÃO
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-white max-w-xs truncate">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{mov.materialName}</span>
                          {mov.itemDetail && (
                            <span className="bg-[#1F1F21] text-[#F2A30F] border border-[#333333] font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded">
                              {mov.itemDetail}
                            </span>
                          )}
                        </div>
                        {mov.notes && (
                          <p className="text-[11px] text-[#888888] font-normal italic truncate mt-0.5">{mov.notes}</p>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white text-sm whitespace-nowrap">
                        {mov.type === 'ENTRADA' || mov.type === 'DEVOLUCAO' ? '+' : '-'}
                        {mov.quantity} <span className="text-xs font-sans font-normal text-[#888888]">{mov.unit}</span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {mov.totalPrice
                          ? mov.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '-'}
                      </td>
                      <td className="p-3 text-[#A0A0A0] font-medium">
                        {mov.workSiteName ? (
                          <span className="inline-flex items-center gap-1 text-[#E0E0E0]">
                            <Building className="w-3 h-3 text-[#666666] shrink-0" />
                            {mov.workSiteName}
                          </span>
                        ) : (
                          <span className="text-[#666666] italic">Depósito Central</span>
                        )}
                      </td>
                      <td className="p-3 text-[#888888]">
                        {mov.workPhase ? (
                          <span className="bg-[#151517] border border-[#1F1F21] text-[#A0A0A0] px-2 py-0.5 rounded text-[11px] font-medium">
                            {mov.workPhase}
                          </span>
                        ) : (
                          <span className="text-[#666666]">-</span>
                        )}
                      </td>
                      <td className="p-3 text-[#888888] text-[11px]">
                        <div className="font-semibold text-[#E0E0E0] flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-[#666666]" /> {mov.responsible}
                        </div>
                        {mov.invoiceNumber && (
                          <div className="text-emerald-400 font-mono font-semibold">
                            {mov.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {canCreateOrEditMovements(currentUser?.role) ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEditMovement(mov)}
                              className="p-1.5 text-[#888888] hover:text-white hover:bg-[#1F1F21] rounded-lg transition-colors cursor-pointer"
                              title="Editar Lançamento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Excluir lançamento do insumo ${mov.materialName}?`)) {
                                  onDeleteMovement(mov.id);
                                }
                              }}
                              className="p-1.5 text-[#888888] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Lançamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#666666] font-mono">Consulta</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
