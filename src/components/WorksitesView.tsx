import React, { useState } from 'react';
import {
  Building2,
  HardHat,
  Plus,
  TrendingUp,
  MapPin,
  Calendar,
  X,
  PackageCheck,
  CheckCircle2,
  Clock,
  DollarSign,
} from 'lucide-react';
import { StockMovement, WorkSite } from '../types';

interface WorksitesViewProps {
  worksites: WorkSite[];
  movements: StockMovement[];
  onAddWorksite: (worksite: Omit<WorkSite, 'id' | 'totalSpentMaterials'>) => void;
  onOpenQuickMovement: () => void;
}

export const WorksitesView: React.FC<WorksitesViewProps> = ({
  worksites,
  movements,
  onAddWorksite,
  onOpenQuickMovement,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorksiteId, setSelectedWorksiteId] = useState<string | null>(null);

  // New Worksite Form State
  const [code, setCode] = useState(`OBR-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [engineerInCharge, setEngineerInCharge] = useState('');
  const [budgetMaterials, setBudgetMaterials] = useState('');
  const [status, setStatus] = useState<'Em Andamento' | 'Planejamento' | 'Concluída'>('Em Andamento');

  const handleSubmitNewWorksite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddWorksite({
      code: code || 'OBR-000',
      name: name.trim(),
      address: address.trim() || 'Canteiro Principal',
      engineerInCharge: engineerInCharge.trim() || 'Engenheiro Responsável',
      status,
      budgetMaterials: parseFloat(budgetMaterials) || 100000,
      startDate: new Date().toISOString().slice(0, 10),
    });

    // Reset
    setName('');
    setAddress('');
    setEngineerInCharge('');
    setBudgetMaterials('');
    setIsModalOpen(false);
  };

  const selectedWorksite = worksites.find((w) => w.id === selectedWorksiteId);

  // Filter movements for selected worksite
  const siteMovements = selectedWorksiteId
    ? movements.filter((m) => m.workSiteId === selectedWorksiteId)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Gestão de Canteiros de Obras
          </h2>
          <p className="text-xs text-[#888888] mt-0.5">
            Acompanhe o consumo de materiais por projeto, eng. responsável e orçamento previsto vs executado.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Cadastrar Nova Obra
        </button>
      </div>

      {/* Grid of Active Worksites */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {worksites.map((site) => {
          // Calculate total spent on this worksite from actual movements
          const actualSpent = movements
            .filter((m) => m.workSiteId === site.id && m.type === 'SAIDA')
            .reduce((acc, m) => acc + (m.totalPrice || 0), 0);

          const budgetPct = site.budgetMaterials > 0 ? (actualSpent / site.budgetMaterials) * 100 : 0;
          const siteMovCount = movements.filter((m) => m.workSiteId === site.id).length;

          return (
            <div
              key={site.id}
              onClick={() => setSelectedWorksiteId(selectedWorksiteId === site.id ? null : site.id)}
              className={`bg-[#0F0F11] rounded-2xl border p-5 shadow-sm transition-all cursor-pointer relative overflow-hidden ${
                selectedWorksiteId === site.id
                  ? 'border-[#F2A30F] ring-2 ring-[#F2A30F]/20 shadow-md bg-[#121215]'
                  : 'border-[#1F1F21] hover:border-[#333333] hover:bg-[#151517]'
              }`}
            >
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs bg-[#151517] border border-[#1F1F21] text-[#A0A0A0] px-2 py-0.5 rounded font-bold">
                  {site.code}
                </span>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    site.status === 'Em Andamento'
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
                      : site.status === 'Planejamento'
                      ? 'bg-blue-950/40 border border-blue-500/30 text-blue-400'
                      : 'bg-[#151517] border border-[#1F1F21] text-[#888888]'
                  }`}
                >
                  {site.status === 'Em Andamento' && <Clock className="w-3 h-3" />}
                  {site.status === 'Concluída' && <CheckCircle2 className="w-3 h-3" />}
                  {site.status}
                </span>
              </div>

              {/* Worksite Name & Engineer */}
              <h3 className="font-bold text-white text-base leading-snug">{site.name}</h3>

              <div className="mt-2 space-y-1 text-xs text-[#888888]">
                <div className="flex items-center gap-1.5 text-[#888888]">
                  <MapPin className="w-3.5 h-3.5 text-[#666666] shrink-0" />
                  <span className="truncate">{site.address}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#E0E0E0] font-medium">
                  <HardHat className="w-3.5 h-3.5 text-[#F2A30F] shrink-0" />
                  <span className="truncate">{site.engineerInCharge}</span>
                </div>
              </div>

              {/* Financial Progress Bar */}
              <div className="mt-4 p-3 bg-[#151517] border border-[#1F1F21] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#888888] font-medium">Gasto em Materiais:</span>
                  <span className="font-mono font-bold text-white">
                    {actualSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="w-full bg-[#252529] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      budgetPct > 90 ? 'bg-red-500' : budgetPct > 75 ? 'bg-[#F2A30F]' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, budgetPct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#888888]">
                  <span>
                    Orçamento: <strong className="text-white font-mono">{site.budgetMaterials.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                  </span>
                  <span>{budgetPct.toFixed(1)}% do limite</span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-[#1F1F21] flex items-center justify-between text-xs text-[#888888]">
                <span>{siteMovCount} retiradas realizadas</span>
                <span className="text-[#F2A30F] font-bold hover:underline">
                  {selectedWorksiteId === site.id ? 'Fechar Detalhes' : 'Ver Ficha de Consumo →'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Worksite Details Drawer / Section */}
      {selectedWorksite && (
        <div className="bg-[#0F0F11] rounded-2xl border border-[#F2A30F]/40 p-6 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1F1F21]">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#F2A30F]" />
                <h3 className="text-lg font-bold text-white">{selectedWorksite.name}</h3>
                <span className="bg-[#151517] border border-[#1F1F21] text-[#F2A30F] text-xs font-bold px-2 py-0.5 rounded font-mono">
                  {selectedWorksite.code}
                </span>
              </div>
              <p className="text-xs text-[#888888] mt-0.5">
                {selectedWorksite.address} • Responsável: <strong className="text-white">{selectedWorksite.engineerInCharge}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenQuickMovement}
                className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> Lançar Insumo nesta Obra
              </button>
              <button
                onClick={() => setSelectedWorksiteId(null)}
                className="text-[#888888] hover:text-white p-1.5 rounded-lg hover:bg-[#151517] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Site Movements Table */}
          <div>
            <h4 className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider mb-2">
              Histórico de Materiais Entregues no Canteiro
            </h4>

            {siteMovements.length === 0 ? (
              <p className="text-xs text-[#666666] italic py-4">Nenhum insumo foi retirado para esta obra ainda.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#1F1F21]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#151517] text-[#A0A0A0] font-semibold border-b border-[#1F1F21]">
                      <th className="p-2.5">Data</th>
                      <th className="p-2.5">Insumo</th>
                      <th className="p-2.5">Etapa da Obra</th>
                      <th className="p-2.5 text-right">Quantidade</th>
                      <th className="p-2.5 text-right">Valor Total (R$)</th>
                      <th className="p-2.5">Responsável / Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F1F21]">
                    {siteMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-[#151517]">
                        <td className="p-2.5 text-[#888888] font-mono text-[11px]">{m.date}</td>
                        <td className="p-2.5 font-bold text-white">{m.materialName}</td>
                        <td className="p-2.5">
                          <span className="bg-amber-950/40 text-[#F2A30F] border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-medium">
                            {m.workPhase || 'Geral'}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-white">
                          {m.quantity} {m.unit}
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-400">
                          {(m.totalPrice || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-2.5 text-[#888888] text-[11px]">
                          <strong className="text-white">{m.responsible}</strong>
                          {m.notes && <span className="block text-[#666666]">{m.notes}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: New Worksite */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F11] rounded-2xl shadow-2xl border border-[#1F1F21] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-[#E0E0E0] text-xs sm:text-sm">
            <div className="bg-[#151517] text-white px-6 py-4 flex items-center justify-between border-b border-[#1F1F21]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#F2A30F]" />
                <h3 className="font-bold text-base">Cadastrar Nova Obra / Canteiro</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#888888] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewWorksite} className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Código do Projeto *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2 font-mono text-xs text-white focus:border-[#F2A30F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Nome da Obra / Edifício *</label>
                <input
                  type="text"
                  placeholder="ex: Edifício Torre Sul - Bloco B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2 font-medium text-white focus:border-[#F2A30F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Endereço da Obra</label>
                <input
                  type="text"
                  placeholder="ex: Av. Brasil, 500"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2 text-white focus:border-[#F2A30F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Engenheiro / Responsável Técnico</label>
                <input
                  type="text"
                  placeholder="ex: Eng. Marcos Pereira (CREA 12345)"
                  value={engineerInCharge}
                  onChange={(e) => setEngineerInCharge(e.target.value)}
                  className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2 text-white focus:border-[#F2A30F] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Orçamento Insumos (R$)</label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="ex: 150000"
                    value={budgetMaterials}
                    onChange={(e) => setBudgetMaterials(e.target.value)}
                    className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2 text-white focus:border-[#F2A30F] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Status Inicial</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2 text-white focus:border-[#F2A30F] outline-none"
                  >
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Planejamento">Planejamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1F1F21]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#1F1F21] rounded-lg text-[#A0A0A0] hover:text-white hover:bg-[#151517] font-medium text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold rounded-lg text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  Salvar Obra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
