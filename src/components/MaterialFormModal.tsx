import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { MaterialCategory, MaterialItem } from '../types';
import { sanitizeForFirestore } from '../lib/firebase';

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialToEdit?: MaterialItem | null;
  onSaveMaterial: (material: Omit<MaterialItem, 'id' | 'lastUpdated'>, id?: string) => Promise<void> | void;
}

const CATEGORIES: MaterialCategory[] = [
  'Cimento e Agregados',
  'Aço e Estrutura',
  'Alvenaria e Blocos',
  'Argamassas e Selantes',
  'Tubos e Conexões',
  'Pintura e Acabamento',
  'Madeiras e Fôrmas',
  'Elétrica',
  'Cobertura',
  'Equipamentos e EPIs',
  'Outros',
];

const COMMON_UNITS = [
  'Saco 50kg',
  'Saco 20kg',
  'm³',
  'kg',
  'Barra 12m',
  'Barra 6m',
  'Unidade',
  'Lata 18L',
  'Rolo 100m',
  'Caixa',
  'Metro',
  'Fardo',
  'Par',
];

export const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  isOpen,
  onClose,
  materialToEdit,
  onSaveMaterial,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('Cimento e Agregados');
  const [quantity, setQuantity] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [unit, setUnit] = useState('Saco 50kg');
  const [avgUnitPrice, setAvgUnitPrice] = useState('');
  const [location, setLocation] = useState('Almoxarifado A');
  const [details, setDetails] = useState('');
  const [detailsOptionsInput, setDetailsOptionsInput] = useState('');
  const [supplier, setSupplier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsSaving(false);

    if (materialToEdit) {
      setCode(materialToEdit.code);
      setName(materialToEdit.name);
      setCategory(materialToEdit.category);
      setQuantity(materialToEdit.quantity.toString());
      setMinQuantity(materialToEdit.minQuantity.toString());
      setUnit(materialToEdit.unit);
      setAvgUnitPrice(materialToEdit.avgUnitPrice.toString());
      setLocation(materialToEdit.location);
      setSupplier(materialToEdit.supplier);
      setDetails(materialToEdit.details || '');
      setDetailsOptionsInput(materialToEdit.detailsOptions ? materialToEdit.detailsOptions.join(', ') : '');
      setExpiryDate(materialToEdit.expiryDate || '');
      setBatchNumber(materialToEdit.batchNumber || '');
      setNotes(materialToEdit.notes || '');
    } else {
      // Auto-generate code
      const randomCode = `INS-${Math.floor(100 + Math.random() * 900)}`;
      setCode(randomCode);
      setName('');
      setCategory('Cimento e Agregados');
      setQuantity('0');
      setMinQuantity('10');
      setUnit('Unidade');
      setAvgUnitPrice('0.00');
      setLocation('Almoxarifado Principal');
      setSupplier('');
      setDetails('');
      setDetailsOptionsInput('');
      setExpiryDate('');
      setBatchNumber('');
      setNotes('');
    }
  }, [materialToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Informe o nome / descrição do insumo.');
      return;
    }

    setIsSaving(true);

    try {
      const parsedOptions = detailsOptionsInput
        ? detailsOptionsInput.split(',').map((o) => o.trim()).filter((o) => o.length > 0)
        : undefined;

      const materialPayload: Record<string, any> = {
        code: code.trim() || 'INS-000',
        name: name.trim(),
        category,
        quantity: parseFloat(quantity) || 0,
        minQuantity: parseFloat(minQuantity) || 0,
        unit: unit.trim(),
        avgUnitPrice: parseFloat(avgUnitPrice) || 0,
        location: location.trim() || 'Almoxarifado',
        supplier: supplier.trim() || 'Não especificado',
      };

      if (details.trim()) {
        materialPayload.details = details.trim();
      } else if (parsedOptions && parsedOptions[0]) {
        materialPayload.details = parsedOptions[0];
      }

      if (parsedOptions && parsedOptions.length > 0) {
        materialPayload.detailsOptions = parsedOptions;
      }

      if (expiryDate && expiryDate.trim()) {
        materialPayload.expiryDate = expiryDate.trim();
      }

      if (batchNumber && batchNumber.trim()) {
        materialPayload.batchNumber = batchNumber.trim();
      }

      if (notes && notes.trim()) {
        materialPayload.notes = notes.trim();
      }

      await onSaveMaterial(
        sanitizeForFirestore(materialPayload) as Omit<MaterialItem, 'id' | 'lastUpdated'>,
        materialToEdit?.id
      );

      // Display success message ONLY AFTER Firestore confirms writing
      setSuccessMsg(materialToEdit ? 'Insumo atualizado com sucesso no Firestore!' : 'Insumo cadastrado com sucesso no Firestore!');
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('[MaterialFormModal Error] Erro ao gravar no Firestore:', err);
      setErrorMsg(err?.message || 'Erro ao gravar o insumo no banco de dados Firestore.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F0F11] rounded-2xl shadow-2xl border border-[#1F1F21] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-[#151517] border-b border-[#1F1F21] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F2A30F]/15 text-[#F2A30F] rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {materialToEdit ? 'Editar Insumo de Construção' : 'Cadastrar Novo Insumo'}
              </h2>
              <p className="text-xs text-[#888888]">Preencha os detalhes técnicos para controle de estoque</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white p-1 rounded-lg hover:bg-[#1F1F21] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-[#E0E0E0] text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl flex items-center gap-2 text-xs">
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
          {/* Row 1: Code, Category & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Código / SKU *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 font-mono text-xs text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Categoria *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white focus:ring-2 focus:ring-[#F2A30F] outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#151517] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Unidade de Medida *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white focus:ring-2 focus:ring-[#F2A30F] outline-none"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} className="bg-[#151517] text-white">
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1">Descrição / Nome do Insumo *</label>
            <input
              type="text"
              placeholder="ex: Cimento CP II-F 32 Votoran 50kg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 font-medium text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
            />
          </div>

          {/* Row 2: Quantities & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Quantidade Inicial</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Estoque Mínimo (Alerta) *</label>
              <input
                type="number"
                step="any"
                value={minQuantity}
                onChange={(e) => setMinQuantity(e.target.value)}
                required
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Preço Unitário Médio (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="R$"
                value={avgUnitPrice}
                onChange={(e) => setAvgUnitPrice(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>
          </div>

          {/* Row 3: Details / Variations (e.g., Colors, Specs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#151517] p-3 rounded-xl border border-[#1F1F21]">
            <div>
              <label className="block text-xs font-semibold text-[#F2A30F] mb-1">
                Detalhe / Variação Padrão (ex: Cor, Tipo)
              </label>
              <input
                type="text"
                placeholder="ex: Vermelho ou 400ml Fosco"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-[#0F0F11] border border-[#2B2B2E] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
              />
              <span className="text-[10px] text-[#888888] mt-0.5 block">
                Ex: Para Tinta Spray, especifique a cor principal.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F2A30F] mb-1">
                Opções de Cores / Variações (Separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="ex: Vermelho, Azul, Preto, Amarelo"
                value={detailsOptionsInput}
                onChange={(e) => setDetailsOptionsInput(e.target.value)}
                className="w-full bg-[#0F0F11] border border-[#2B2B2E] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
              />
              <span className="text-[10px] text-[#888888] mt-0.5 block">
                Permite escolher a cor/detalhe ao lançar movimentações.
              </span>
            </div>
          </div>

          {/* Row 4: Location & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Local de Armazenamento</label>
              <input
                type="text"
                placeholder="ex: Almoxarifado A - Baia Coberta"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Fornecedor Principal</label>
              <input
                type="text"
                placeholder="ex: Votorantim Cimentos / Gerdau"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>
          </div>

          {/* Row 4: Expiry Date & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Data de Validade (Se houver)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#888888] mb-1">Lote / Código de Rastreabilidade</label>
              <input
                type="text"
                placeholder="ex: LOTE-2026-08"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#888888] mb-1">Observações de Armazenamento / Dicas</label>
            <textarea
              rows={2}
              placeholder="ex: Manter elevado em pallets para evitar umidade."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-lg p-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#1F1F21]">
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
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Insumo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
