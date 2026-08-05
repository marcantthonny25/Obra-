import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, RefreshCw, RotateCcw, AlertCircle, Trash2, Calendar, User, FileText, Building, CheckCircle2, Loader2 } from 'lucide-react';
import { MaterialItem, MovementType, StockMovement, WorkPhase, WorkSite } from '../types';

interface EditMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  movement: StockMovement | null;
  materials: MaterialItem[];
  worksites: WorkSite[];
  onSaveMovement: (id: string, updatedData: Partial<StockMovement>) => Promise<void> | void;
  onDeleteMovement: (id: string) => Promise<void> | void;
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

export const EditMovementModal: React.FC<EditMovementModalProps> = ({
  isOpen,
  onClose,
  movement,
  materials,
  worksites,
  onSaveMovement,
  onDeleteMovement,
}) => {
  const [type, setType] = useState<MovementType>('SAIDA');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [workSiteId, setWorkSiteId] = useState<string>('');
  const [workPhase, setWorkPhase] = useState<WorkPhase>('Estrutura / Concretagem');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [responsible, setResponsible] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [itemDetail, setItemDetail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSaving(false);

    if (movement) {
      setType(movement.type);
      setQuantity(String(movement.quantity));
      setUnitPrice(movement.unitPrice ? String(movement.unitPrice) : '');
      setWorkSiteId(movement.workSiteId || (worksites[0]?.id || ''));
      setWorkPhase(movement.workPhase || 'Estrutura / Concretagem');
      setInvoiceNumber(movement.invoiceNumber || '');
      setResponsible(movement.responsible || '');
      setNotes(movement.notes || '');
      setItemDetail(movement.itemDetail || '');
    }
  }, [movement, isOpen]);

  if (!isOpen || !movement) return null;

  const currentMaterial = materials.find((m) => m.id === movement.materialId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Informe uma quantidade válida maior que zero.');
      return;
    }

    if (!responsible.trim()) {
      setErrorMsg('Informe o nome do responsável.');
      return;
    }

    const price = unitPrice ? parseFloat(unitPrice) : (movement.unitPrice || currentMaterial?.avgUnitPrice || 0);
    const selectedWorksite = worksites.find((w) => w.id === workSiteId);

    setIsSaving(true);

    try {
      await onSaveMovement(movement.id, {
        type,
        itemDetail: itemDetail.trim() ? itemDetail.trim() : undefined,
        quantity: qty,
        unitPrice: price,
        totalPrice: price * qty,
        workSiteId: (type === 'SAIDA' || type === 'DEVOLUCAO') ? selectedWorksite?.id : undefined,
        workSiteName: (type === 'SAIDA' || type === 'DEVOLUCAO') ? selectedWorksite?.name : undefined,
        workPhase: (type === 'SAIDA' || type === 'DEVOLUCAO') ? workPhase : undefined,
        invoiceNumber: type === 'ENTRADA' ? invoiceNumber : undefined,
        responsible: responsible.trim(),
        notes: notes.trim(),
      });

      setSuccessMsg('Movimentação atualizada com sucesso no Firestore!');
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('[EditMovementModal Error] Erro ao atualizar no Firestore:', err);
      setErrorMsg(err?.message || 'Erro ao atualizar a movimentação no Firestore.');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir este registro de movimentação (${movement.type} - ${movement.materialName})?`)) {
      setErrorMsg('');
      setSuccessMsg('');
      setIsSaving(true);
      try {
        await onDeleteMovement(movement.id);
        setSuccessMsg('Movimentação excluída com sucesso!');
        setTimeout(() => {
          setIsSaving(false);
          onClose();
        }, 800);
      } catch (err: any) {
        console.error('[EditMovementModal Error] Erro ao excluir no Firestore:', err);
        setErrorMsg(err?.message || 'Erro ao excluir a movimentação no Firestore.');
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] w-full max-w-lg overflow-hidden my-auto shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#151517] border-b border-[#1F1F21] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#F2A30F]" />
              Editar Lançamento de Movimentação
            </h2>
            <p className="text-xs text-[#888888]">
              Insumo: <strong className="text-white">{movement.materialName}</strong> • Data: {movement.date}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-white rounded-lg hover:bg-[#1F1F21] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 text-red-300 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Movement Type Selector */}
          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">Tipo de Movimentação</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setType('ENTRADA')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 shadow-sm'
                    : 'bg-[#151517] border-[#1F1F21] text-[#888888] hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>ENTRADA</span>
              </button>

              <button
                type="button"
                onClick={() => setType('SAIDA')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'SAIDA'
                    ? 'bg-amber-950/60 border-amber-500 text-[#F2A30F] shadow-sm'
                    : 'bg-[#151517] border-[#1F1F21] text-[#888888] hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>SAÍDA OBRA</span>
              </button>

              <button
                type="button"
                onClick={() => setType('AJUSTE')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'AJUSTE'
                    ? 'bg-blue-950/60 border-blue-500 text-blue-400 shadow-sm'
                    : 'bg-[#151517] border-[#1F1F21] text-[#888888] hover:text-white'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>PERDA/AJUSTE</span>
              </button>

              <button
                type="button"
                onClick={() => setType('DEVOLUCAO')}
                className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  type === 'DEVOLUCAO'
                    ? 'bg-purple-950/60 border-purple-500 text-purple-400 shadow-sm'
                    : 'bg-[#151517] border-[#1F1F21] text-[#888888] hover:text-white'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>DEVOLUÇÃO</span>
              </button>
            </div>
          </div>

          {/* Item Detail / Variation */}
          <div className="bg-[#151517] p-3 rounded-xl border border-[#222226]">
            <label className="block text-xs font-bold text-[#F2A30F] mb-1">
              Detalhe / Variação do Insumo (ex: Cor, Marca, Especificação)
            </label>
            {currentMaterial?.detailsOptions && currentMaterial.detailsOptions.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  value={itemDetail}
                  onChange={(e) => setItemDetail(e.target.value)}
                  className="w-full bg-[#0F0F11] border border-[#333333] rounded-lg p-2 text-white focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
                >
                  {currentMaterial.detailsOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#151517] text-white">
                      {opt}
                    </option>
                  ))}
                  <option value="">+ Outro / Personalizado...</option>
                </select>
                {(!itemDetail || !currentMaterial.detailsOptions.includes(itemDetail)) && (
                  <input
                    type="text"
                    placeholder="Digite o detalhe (ex: Cor Vermelha, Tipo Fosco)..."
                    value={itemDetail}
                    onChange={(e) => setItemDetail(e.target.value)}
                    className="w-full bg-[#0F0F11] border border-[#333333] rounded-lg p-2 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
                  />
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder="ex: Cor: Vermelho, Modelo A, 400ml..."
                value={itemDetail}
                onChange={(e) => setItemDetail(e.target.value)}
                className="w-full bg-[#0F0F11] border border-[#333333] rounded-lg p-2 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
              />
            )}
          </div>

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                Quantidade Movimentada ({movement.unit}) *
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:border-[#F2A30F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                Preço Unitário (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder={String(movement.unitPrice || 0)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#F2A30F] outline-none"
              />
            </div>
          </div>

          {/* Conditional Worksite and Phase if SAIDA or DEVOLUCAO */}
          {(type === 'SAIDA' || type === 'DEVOLUCAO') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#151517] border border-[#1F1F21] rounded-xl">
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Obra / Canteiro</label>
                <select
                  value={workSiteId}
                  onChange={(e) => setWorkSiteId(e.target.value)}
                  className="w-full bg-[#0F0F11] border border-[#1F1F21] rounded-lg p-2 text-xs text-white focus:border-[#F2A30F] outline-none"
                >
                  {worksites.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Etapa da Obra</label>
                <select
                  value={workPhase}
                  onChange={(e) => setWorkPhase(e.target.value as WorkPhase)}
                  className="w-full bg-[#0F0F11] border border-[#1F1F21] rounded-lg p-2 text-xs text-white focus:border-[#F2A30F] outline-none"
                >
                  {WORK_PHASES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Conditional Invoice Number if ENTRADA */}
          {type === 'ENTRADA' && (
            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Número da Nota Fiscal (NF-e)</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="ex: NF-10492"
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#F2A30F] outline-none"
              />
            </div>
          )}

          {/* Responsible & Notes */}
          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Responsável pelo Lançamento *</label>
            <input
              type="text"
              required
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl px-3 py-2 text-xs text-white focus:border-[#F2A30F] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Observações / Motivo</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais do lançamento..."
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2.5 text-xs text-white focus:border-[#F2A30F] outline-none resize-none"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1F1F21]">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 disabled:opacity-50 border border-red-500/40 text-red-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Registro</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 border border-[#1F1F21] bg-[#151517] hover:bg-[#1F1F21] text-xs font-semibold rounded-xl text-[#AAAAAA] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-[#F2A30F] hover:bg-amber-400 disabled:bg-amber-600/50 text-black font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando no Firestore...</span>
                  </>
                ) : (
                  <span>Salvar Lançamento</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
