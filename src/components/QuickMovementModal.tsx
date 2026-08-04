import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, RefreshCw, RotateCcw, AlertCircle, Lock } from 'lucide-react';
import { MaterialItem, MovementType, StockMovement, WorkPhase, WorkSite, User, isWorksiteLockedRole } from '../types';

interface QuickMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialItem[];
  worksites: WorkSite[];
  preSelectedMaterialId?: string;
  onAddMovement: (movement: Omit<StockMovement, 'id' | 'date'>, updatedUnitPrice?: number) => void;
  defaultResponsible?: string;
  currentUser?: User | null;
  selectedWorksiteId?: string;
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

export const QuickMovementModal: React.FC<QuickMovementModalProps> = ({
  isOpen,
  onClose,
  materials,
  worksites,
  preSelectedMaterialId,
  onAddMovement,
  defaultResponsible = '',
  currentUser,
  selectedWorksiteId = 'ALL',
}) => {
  const isLocked = currentUser ? isWorksiteLockedRole(currentUser.role) : false;

  const [materialId, setMaterialId] = useState<string>(preSelectedMaterialId || (materials[0]?.id || ''));
  const [type, setType] = useState<MovementType>('SAIDA');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [workSiteId, setWorkSiteId] = useState<string>('');
  const [workPhase, setWorkPhase] = useState<WorkPhase>('Estrutura / Concretagem');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [responsible, setResponsible] = useState<string>(defaultResponsible || currentUser?.name || '');
  const [notes, setNotes] = useState<string>('');
  const [itemDetail, setItemDetail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Auto-set initial worksite
  useEffect(() => {
    if (isOpen) {
      if (selectedWorksiteId && selectedWorksiteId !== 'ALL') {
        setWorkSiteId(selectedWorksiteId);
      } else if (currentUser && isWorksiteLockedRole(currentUser.role)) {
        const matched = worksites.find(
          (w) => w.id === currentUser.worksiteId || w.name.toLowerCase() === currentUser.worksiteAssigned?.toLowerCase()
        );
        if (matched) setWorkSiteId(matched.id);
        else if (worksites[0]) setWorkSiteId(worksites[0].id);
      } else if (worksites[0]) {
        setWorkSiteId(worksites[0].id);
      }
      setResponsible(currentUser?.name || defaultResponsible || '');
    }
  }, [isOpen, selectedWorksiteId, currentUser, worksites]);

  const selectedMaterial = materials.find((m) => m.id === materialId);

  // Sync default detail when material changes
  React.useEffect(() => {
    if (selectedMaterial) {
      if (selectedMaterial.detailsOptions && selectedMaterial.detailsOptions.length > 0) {
        setItemDetail(selectedMaterial.detailsOptions[0]);
      } else if (selectedMaterial.details) {
        setItemDetail(selectedMaterial.details);
      } else {
        setItemDetail('');
      }
    }
  }, [materialId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedMaterial) {
      setErrorMsg('Selecione um insumo válido.');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Informe uma quantidade válida maior que zero.');
      return;
    }

    if ((type === 'SAIDA' || type === 'AJUSTE') && qty > selectedMaterial.quantity) {
      setErrorMsg(
        `Quantidade insuficiente em estoque! Saldo atual: ${selectedMaterial.quantity} ${selectedMaterial.unit}.`
      );
      return;
    }

    if (!responsible.trim()) {
      setErrorMsg('Informe o nome do responsável pelo lançamento/retirada.');
      return;
    }

    const price = unitPrice ? parseFloat(unitPrice) : selectedMaterial.avgUnitPrice;
    const selectedWorksite = worksites.find((w) => w.id === workSiteId);

    onAddMovement(
      {
        type,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        itemDetail: itemDetail.trim() ? itemDetail.trim() : undefined,
        quantity: qty,
        unit: selectedMaterial.unit,
        unitPrice: price,
        totalPrice: price * qty,
        workSiteId: (type === 'SAIDA' || type === 'DEVOLUCAO') ? selectedWorksite?.id : undefined,
        workSiteName: (type === 'SAIDA' || type === 'DEVOLUCAO') ? selectedWorksite?.name : undefined,
        workPhase: (type === 'SAIDA' || type === 'DEVOLUCAO') ? workPhase : undefined,
        invoiceNumber: type === 'ENTRADA' ? invoiceNumber : undefined,
        responsible: responsible.trim(),
        notes: notes.trim(),
      },
      type === 'ENTRADA' && unitPrice ? parseFloat(unitPrice) : undefined
    );

    // Reset and close
    setQuantity('');
    setNotes('');
    setInvoiceNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F0F11] rounded-2xl shadow-2xl border border-[#1F1F21] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#151517] border-b border-[#1F1F21] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F2A30F]/15 text-[#F2A30F] rounded-lg">
              {type === 'ENTRADA' && <ArrowDownRight className="w-5 h-5 text-emerald-400" />}
              {type === 'SAIDA' && <ArrowUpRight className="w-5 h-5 text-[#F2A30F]" />}
              {type === 'AJUSTE' && <RefreshCw className="w-5 h-5 text-blue-400" />}
              {type === 'DEVOLUCAO' && <RotateCcw className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <h2 className="text-lg font-bold">Lançar Movimentação de Estoque</h2>
              <p className="text-xs text-[#888888]">Registre entradas, saídas para obra ou perdas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white p-1 rounded-lg hover:bg-[#1F1F21] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[#E0E0E0] text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-lg flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1.5">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#151517] border border-[#1F1F21] rounded-xl">
              <button
                type="button"
                onClick={() => setType('SAIDA')}
                className={`py-2 px-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
                  type === 'SAIDA'
                    ? 'bg-[#F2A30F] text-black shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Saída / Obra
              </button>
              <button
                type="button"
                onClick={() => setType('ENTRADA')}
                className={`py-2 px-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Entrada (NF)
              </button>
              <button
                type="button"
                onClick={() => setType('AJUSTE')}
                className={`py-2 px-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
                  type === 'AJUSTE'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Perda/Ajuste
              </button>
              <button
                type="button"
                onClick={() => setType('DEVOLUCAO')}
                className={`py-2 px-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1 transition-all ${
                  type === 'DEVOLUCAO'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Devolução
              </button>
            </div>
          </div>

          {/* Material Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1">Insumo</label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white focus:ring-2 focus:ring-[#F2A30F] focus:border-[#F2A30F] outline-none"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id} className="bg-[#151517] text-white">
                  {m.code} - {m.name} (Saldo: {m.quantity} {m.unit})
                </option>
              ))}
            </select>
            {selectedMaterial && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-[#888888]">
                <span>Local: {selectedMaterial.location}</span>
                <span>
                  Saldo Atual:{' '}
                  <strong className={selectedMaterial.quantity <= selectedMaterial.minQuantity ? 'text-[#F2A30F]' : 'text-white'}>
                    {selectedMaterial.quantity} {selectedMaterial.unit}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Item Detail (e.g. Color) */}
          <div className="bg-[#151517] p-3 rounded-xl border border-[#222226]">
            <label className="block text-xs font-bold text-[#F2A30F] mb-1">
              Detalhe / Variação do Insumo (ex: Cor, Marca, Especificação)
            </label>
            {selectedMaterial?.detailsOptions && selectedMaterial.detailsOptions.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  value={itemDetail}
                  onChange={(e) => setItemDetail(e.target.value)}
                  className="w-full bg-[#0F0F11] border border-[#333333] rounded-lg p-2 text-white focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
                >
                  {selectedMaterial.detailsOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-[#151517] text-white">
                      {opt}
                    </option>
                  ))}
                  <option value="">+ Outro / Personalizado...</option>
                </select>
                {(!itemDetail || !selectedMaterial.detailsOptions.includes(itemDetail)) && (
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
            <span className="text-[10px] text-[#888888] mt-1 block">
              A especificação selecionada ficará registrada no histórico da movimentação.
            </span>
          </div>

          {/* Quantity & Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">
                Quantidade ({selectedMaterial?.unit || 'Unid'}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="ex: 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">
                {type === 'ENTRADA' ? 'Novo Preço Unitário (R$)' : 'Preço Médio (R$)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder={selectedMaterial ? `Atual: R$ ${selectedMaterial.avgUnitPrice.toFixed(2)}` : 'R$'}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>
          </div>

          {/* If SAIDA or DEVOLUCAO: Select Worksite & Work Phase */}
          {(type === 'SAIDA' || type === 'DEVOLUCAO') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#151517] border border-[#F2A30F]/30 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-[#F2A30F] mb-1 flex items-center justify-between">
                  <span>Canteiro / Obra de Destino *</span>
                  {isLocked && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                      <Lock className="w-3 h-3" /> Obra Fixa
                    </span>
                  )}
                </label>
                <select
                  value={workSiteId}
                  disabled={isLocked}
                  onChange={(e) => setWorkSiteId(e.target.value)}
                  className={`w-full bg-[#0F0F11] border border-[#1F1F21] rounded-lg p-2 text-white text-xs outline-none ${
                    isLocked ? 'opacity-80 cursor-not-allowed bg-[#18181B] text-amber-300 font-bold' : 'focus:ring-2 focus:ring-[#F2A30F]'
                  }`}
                >
                  {worksites.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#0F0F11] text-white">
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F2A30F] mb-1">
                  Etapa da Obra *
                </label>
                <select
                  value={workPhase}
                  onChange={(e) => setWorkPhase(e.target.value as WorkPhase)}
                  className="w-full bg-[#0F0F11] border border-[#1F1F21] rounded-lg p-2 text-white text-xs focus:ring-2 focus:ring-[#F2A30F] outline-none"
                >
                  {WORK_PHASES.map((phase) => (
                    <option key={phase} value={phase} className="bg-[#0F0F11] text-white">
                      {phase}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* If ENTRADA: Invoice number */}
          {type === 'ENTRADA' && (
            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">
                Número da Nota Fiscal / Romaneio
              </label>
              <input
                type="text"
                placeholder="ex: NF-e 98412"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
              />
            </div>
          )}

          {/* Responsible & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">
                Responsável (Almoxarife / Mestre) *
              </label>
              <input
                type="text"
                placeholder="ex: Carlos Silva"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                required
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">
                Observações / Finalidade
              </label>
              <input
                type="text"
                placeholder="ex: Laje Bloco A"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1F1F21]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#1F1F21] bg-[#151517] rounded-lg text-[#E0E0E0] hover:text-white hover:bg-[#1F1F21] font-medium text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold rounded-lg text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Confirmar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
