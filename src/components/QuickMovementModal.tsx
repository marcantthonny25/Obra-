import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ArrowDownRight, ArrowUpRight, RefreshCw, RotateCcw, AlertCircle, Lock, CheckCircle2, Loader2, Search, ChevronDown, Check } from 'lucide-react';
import { MaterialItem, MovementType, StockMovement, WorkPhase, WorkSite, User, CatalogoInsumo, isWorksiteLockedRole, canCreateOrEditMovements } from '../types';
import { sanitizeForFirestore } from '../lib/firebase';

interface QuickMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialItem[];
  catalogoInsumos?: CatalogoInsumo[];
  worksites: WorkSite[];
  preSelectedMaterialId?: string;
  onAddMovement: (movement: Omit<StockMovement, 'id' | 'date'>, updatedUnitPrice?: number) => Promise<void> | void;
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
  catalogoInsumos,
  worksites,
  preSelectedMaterialId,
  onAddMovement,
  defaultResponsible = '',
  currentUser,
  selectedWorksiteId = 'ALL',
}) => {
  const isLocked = currentUser ? isWorksiteLockedRole(currentUser.role) : false;

  const [materialId, setMaterialId] = useState<string>(preSelectedMaterialId || '');
  const [insumoSearchTerm, setInsumoSearchTerm] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Combine materials and catalogoInsumos into a single robust list of all available insumos
  const allAvailableMaterials = useMemo(() => {
    const list: MaterialItem[] = [...materials];
    const existingIds = new Set(list.map((m) => m.id));
    const existingCodes = new Set(list.map((m) => m.code));

    if (catalogoInsumos && catalogoInsumos.length > 0) {
      for (const insumo of catalogoInsumos) {
        const id = insumo.id;
        const code = insumo.codigoExterno || insumo.id;
        if (!existingIds.has(id) && !existingCodes.has(code)) {
          list.push({
            id,
            code,
            name: insumo.nome,
            category: insumo.categoria || 'Geral',
            quantity: 0,
            minQuantity: 10,
            unit: insumo.unidade || 'un',
            avgUnitPrice: insumo.precoEstimado || insumo.precoUnitario || 0,
            location: 'Catálogo Global',
            supplier: insumo.subcategoria || '',
            lastUpdated: insumo.atualizadoEm || new Date().toISOString().slice(0, 10),
            notes: insumo.observacoes,
          });
        }
      }
    }
    return list;
  }, [materials, catalogoInsumos]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync initial or pre-selected material when modal opens or available materials update
  useEffect(() => {
    if (isOpen) {
      if (preSelectedMaterialId) {
        setMaterialId(preSelectedMaterialId);
        const match = allAvailableMaterials.find((m) => m.id === preSelectedMaterialId);
        if (match) {
          setInsumoSearchTerm(`${match.code} - ${match.name}`);
        }
      } else if (materialId) {
        const match = allAvailableMaterials.find((m) => m.id === materialId);
        if (match && !insumoSearchTerm) {
          setInsumoSearchTerm(`${match.code} - ${match.name}`);
        }
      } else if (allAvailableMaterials.length > 0) {
        const first = allAvailableMaterials[0];
        setMaterialId(first.id);
        setInsumoSearchTerm(`${first.code} - ${first.name}`);
      }
    }
  }, [isOpen, preSelectedMaterialId, allAvailableMaterials]);

  const selectedMaterial = useMemo(
    () => allAvailableMaterials.find((m) => m.id === materialId),
    [allAvailableMaterials, materialId]
  );

  // Filter insumos based on search term (searches by name, code, or category)
  const filteredInsumos = useMemo(() => {
    if (!insumoSearchTerm.trim()) {
      return allAvailableMaterials.slice(0, 60);
    }
    const term = insumoSearchTerm.toLowerCase().trim();
    const matches = allAvailableMaterials.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.code.toLowerCase().includes(term) ||
        (m.category && m.category.toLowerCase().includes(term))
    );
    return matches.slice(0, 60);
  }, [allAvailableMaterials, insumoSearchTerm]);

  // Auto-set initial worksite
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSaving(false);

    if (isOpen) {
      if (currentUser && isWorksiteLockedRole(currentUser.role)) {
        const matched = worksites.find(
          (w) => w.id === currentUser.worksiteId || w.name.toLowerCase() === currentUser.worksiteAssigned?.toLowerCase()
        );
        if (matched) setWorkSiteId(matched.id);
        else if (currentUser.worksiteId) setWorkSiteId(currentUser.worksiteId);
        else if (worksites[0]) setWorkSiteId(worksites[0].id);
      } else if (selectedWorksiteId && selectedWorksiteId !== 'ALL') {
        setWorkSiteId(selectedWorksiteId);
      } else if (worksites[0]) {
        setWorkSiteId(worksites[0].id);
      }
      setResponsible(currentUser?.name || defaultResponsible || '');
    }
  }, [isOpen, selectedWorksiteId, currentUser, worksites]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (currentUser && !canCreateOrEditMovements(currentUser.role)) {
      setErrorMsg('Acesso negado: Perfis de Engenheiro e Coordenador são de leitura e não podem lançar movimentações.');
      return;
    }

    if (!selectedMaterial) {
      setErrorMsg('Selecione um insumo válido.');
      return;
    }

    if (currentUser && isWorksiteLockedRole(currentUser.role)) {
      const assignedWorksite = worksites.find(
        (w) => w.id === currentUser.worksiteId || w.name.toLowerCase() === currentUser.worksiteAssigned?.toLowerCase()
      );
      if (assignedWorksite && workSiteId !== assignedWorksite.id) {
        setErrorMsg(`Almoxarife só pode lançar movimentações na obra vinculada ao seu perfil (${assignedWorksite.name}).`);
        return;
      }
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Informe uma quantidade válida maior que zero.');
      return;
    }

    if ((type === 'SAIDA' || type === 'AJUSTE') && qty > selectedMaterial.quantity) {
      setErrorMsg(
        `Quantidade insuficiente em estoque! Saldo atual no sistema: ${selectedMaterial.quantity} ${selectedMaterial.unit}.`
      );
      return;
    }

    if (!responsible.trim()) {
      setErrorMsg('Informe o nome do responsável pelo lançamento/retirada.');
      return;
    }

    const price = unitPrice ? parseFloat(unitPrice) : selectedMaterial.avgUnitPrice;
    const selectedWorksite = worksites.find((w) => w.id === workSiteId);

    setIsSaving(true);

    try {
      const movementPayload: Record<string, any> = {
        type,
        materialId: selectedMaterial.id,
        materialName: selectedMaterial.name,
        quantity: qty,
        unit: selectedMaterial.unit,
        unitPrice: price,
        totalPrice: price * qty,
        responsible: responsible.trim(),
      };

      if (itemDetail.trim()) {
        movementPayload.itemDetail = itemDetail.trim();
      }

      if ((type === 'SAIDA' || type === 'DEVOLUCAO') && selectedWorksite?.id) {
        movementPayload.workSiteId = selectedWorksite.id;
        movementPayload.workSiteName = selectedWorksite.name;
        if (workPhase) {
          movementPayload.workPhase = workPhase;
        }
      }

      if (type === 'ENTRADA' && invoiceNumber.trim()) {
        movementPayload.invoiceNumber = invoiceNumber.trim();
      }

      if (notes.trim()) {
        movementPayload.notes = notes.trim();
      }

      await onAddMovement(
        sanitizeForFirestore(movementPayload) as Omit<StockMovement, 'id' | 'date'>,
        type === 'ENTRADA' && unitPrice ? parseFloat(unitPrice) : undefined
      );

      // Display success message ONLY AFTER Firestore transaction succeeds
      setSuccessMsg('Movimentação gravada e estoque atualizado com sucesso no Firestore!');
      setTimeout(() => {
        setIsSaving(false);
        setQuantity('');
        setNotes('');
        setInvoiceNumber('');
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('[QuickMovementModal Error] Erro ao gravar movimentação no Firestore:', err);
      setErrorMsg(err?.message || 'Erro ao gravar a movimentação no banco de dados Firestore.');
      setIsSaving(false);
    }
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

          {successMsg && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-lg flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
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

          {/* Material Selection (Searchable Combobox) */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#888888]">Insumo (Catálogo Global)</label>
              <span className="text-[10px] text-[#A0A0A0] font-medium bg-[#1F1F21] px-2 py-0.5 rounded-full">
                {allAvailableMaterials.length.toLocaleString('pt-BR')} insumos no catálogo
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Pesquise por nome (ex: Aço, Cimento) ou código..."
                value={insumoSearchTerm}
                onFocus={() => setIsDropdownOpen(true)}
                onClick={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setInsumoSearchTerm(val);
                  setIsDropdownOpen(true);
                  if (selectedMaterial && val !== `${selectedMaterial.code} - ${selectedMaterial.name}`) {
                    setMaterialId('');
                  }
                }}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg py-2.5 pl-9 pr-10 text-white placeholder-[#666666] focus:ring-2 focus:ring-[#F2A30F] focus:border-[#F2A30F] outline-none text-sm transition-all"
              />
              <Search className="w-4 h-4 text-[#888888] absolute left-3 top-3 pointer-events-none" />
              {insumoSearchTerm ? (
                <button
                  type="button"
                  onClick={() => {
                    setInsumoSearchTerm('');
                    setMaterialId('');
                    setIsDropdownOpen(true);
                  }}
                  className="absolute right-3 top-2.5 text-[#888888] hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <ChevronDown className="w-4 h-4 text-[#888888] absolute right-3 top-3 pointer-events-none" />
              )}
            </div>

            {/* Dropdown List */}
            {isDropdownOpen && (
              <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-[#151517] border border-[#2B2B2E] rounded-xl shadow-2xl divide-y divide-[#1F1F21]">
                {filteredInsumos.length > 0 ? (
                  filteredInsumos.map((item) => {
                    const isSelected = item.id === materialId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setMaterialId(item.id);
                          setInsumoSearchTerm(`${item.code} - ${item.name}`);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 hover:bg-[#222226] transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-[#F2A30F]/15 border-l-4 border-[#F2A30F]' : ''
                        }`}
                      >
                        <div className="pr-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-[#F2A30F] bg-[#F2A30F]/10 px-1.5 py-0.5 rounded shrink-0">
                              {item.code}
                            </span>
                            <span className="text-xs font-semibold text-white truncate">{item.name}</span>
                          </div>
                          <div className="text-[10px] text-[#888888] mt-0.5 flex items-center gap-3">
                            <span>Cat: {item.category || 'Geral'}</span>
                            <span>Un: {item.unit}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#F2A30F] shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-[#888888]">
                    Nenhum insumo encontrado para "<span className="text-white">{insumoSearchTerm}</span>".
                  </div>
                )}
              </div>
            )}

            {selectedMaterial && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#888888] bg-[#18181B] border border-[#26262B] px-3 py-2 rounded-lg">
                <span>Local: <strong className="text-white">{selectedMaterial.location}</strong></span>
                <span>
                  Saldo Atual:{' '}
                  <strong className={selectedMaterial.quantity <= selectedMaterial.minQuantity ? 'text-[#F2A30F]' : 'text-emerald-400'}>
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
              disabled={isSaving}
              className="px-4 py-2 border border-[#1F1F21] bg-[#151517] rounded-lg text-[#E0E0E0] hover:text-white hover:bg-[#1F1F21] font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#F2A30F] hover:bg-amber-400 disabled:bg-amber-600/50 text-black font-bold rounded-lg text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gravando no Firestore...</span>
                </>
              ) : (
                <span>Confirmar Lançamento</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
