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
  Edit2,
  Trash2,
  ShieldCheck,
  Info,
  Lock,
} from 'lucide-react';
import { useEffect } from 'react';
import { StockMovement, WorkSite, canManageWorksites, isGlobalWorksiteRole, canCreateOrEditMovements } from '../types';
import type { User } from '../types';

interface WorksitesViewProps {
  worksites: WorkSite[];
  movements: StockMovement[];
  currentUser?: User | null;
  globalSelectedWorksiteId?: string;
  onOpenNewWorksite: () => void;
  onEditWorksite: (worksite: WorkSite) => void;
  onDeleteWorksite: (id: string) => void;
  onOpenQuickMovement: () => void;
}

export const WorksitesView: React.FC<WorksitesViewProps> = ({
  worksites,
  movements,
  currentUser,
  globalSelectedWorksiteId = 'ALL',
  onOpenNewWorksite,
  onEditWorksite,
  onDeleteWorksite,
  onOpenQuickMovement,
}) => {
  const [selectedWorksiteId, setSelectedWorksiteId] = useState<string | null>(null);

  const isAdmin = canManageWorksites(currentUser?.role);
  const isGlobalUser = isGlobalWorksiteRole(currentUser?.role);
  const canMove = canCreateOrEditMovements(currentUser?.role);

  const displayWorksites = (globalSelectedWorksiteId && globalSelectedWorksiteId !== 'ALL')
    ? worksites.filter((w) => w.id === globalSelectedWorksiteId)
    : worksites;

  const activeWorksiteId = selectedWorksiteId || (globalSelectedWorksiteId !== 'ALL' ? globalSelectedWorksiteId : null);
  const selectedWorksite = worksites.find((w) => w.id === activeWorksiteId);

  // Filter movements for selected worksite
  const siteMovements = activeWorksiteId
    ? movements.filter((m) => m.workSiteId === activeWorksiteId)
    : [];

  // Temporary log for debugging worksite filtering
  useEffect(() => {
    console.log(
      `[Log Canteiros/WorksitesView] role: ${currentUser?.role || 'Visitante'}, selectedWorksiteId: ${globalSelectedWorksiteId}, docsCount: ${displayWorksites.length}`
    );
  }, [currentUser?.role, globalSelectedWorksiteId, displayWorksites.length]);

  return (
    <div className="space-y-6">
      {/* Notice Banner based on Role */}
      {!isAdmin ? (
        <div className="bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-2xl text-amber-300 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Modo de Leitura / Consulta de Obras:</span> O seu perfil (
              <span className="text-amber-400 font-semibold">{currentUser?.role || 'Visitante'}</span>) pode visualizar as obras, mas somente o <strong className="text-white">Administrador</strong> tem permissão para cadastrar, editar ou excluir canteiros.
            </div>
          </div>
          <span className="bg-amber-900/60 border border-amber-500/40 font-mono text-[10px] font-bold px-2 py-1 rounded-lg shrink-0">
            ADMIN APENAS
          </span>
        </div>
      ) : (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Gestão Total de Obras (Administrador):</span> Acesso autorizativo completo para cadastrar, editar e gerenciar orçamentos de todos os canteiros.
            </div>
          </div>
          <span className="bg-emerald-900/60 border border-emerald-500/40 font-mono text-[10px] font-bold px-2 py-1 rounded-lg shrink-0">
            ADMINISTRADOR
          </span>
        </div>
      )}

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

        {isAdmin && (
          <button
            onClick={onOpenNewWorksite}
            className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Cadastrar Nova Obra
          </button>
        )}
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
                <span>{siteMovCount} retiradas</span>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => onEditWorksite(site)}
                        className="p-1.5 text-[#888888] hover:text-white hover:bg-[#1F1F21] rounded-lg transition-colors cursor-pointer"
                        title="Editar Obra (Administrador)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir a obra "${site.name}"?`)) {
                            onDeleteWorksite(site.id);
                            if (selectedWorksiteId === site.id) setSelectedWorksiteId(null);
                          }
                        }}
                        className="p-1.5 text-[#888888] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Obra (Administrador)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <span className="text-[#F2A30F] font-bold hover:underline ml-1 text-[11px]">
                    {selectedWorksiteId === site.id ? 'Fechar' : 'Detalhes →'}
                  </span>
                </div>
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
              {isAdmin && (
                <>
                  <button
                    onClick={() => onEditWorksite(selectedWorksite)}
                    className="bg-[#151517] border border-[#1F1F21] hover:bg-[#1F1F21] text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#F2A30F]" /> Editar Obra
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir a obra "${selectedWorksite.name}"?`)) {
                        onDeleteWorksite(selectedWorksite.id);
                        setSelectedWorksiteId(null);
                      }
                    }}
                    className="bg-red-950/40 border border-red-500/30 hover:bg-red-900/50 text-red-400 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </>
              )}
              {canMove && (
                <button
                  onClick={onOpenQuickMovement}
                  className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" /> Lançar Insumo
                </button>
              )}
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
    </div>
  );
};
