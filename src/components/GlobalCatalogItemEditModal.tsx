import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Tag,
  Barcode,
  Layers,
  Archive,
  Power,
  History,
} from 'lucide-react';
import {
  CatalogoInsumo,
  MaterialCategory,
  User,
  DetalhesAdicionaisInsumo,
  canCreateOrEditCatalog,
} from '../types';
import { saveGlobalCatalogItem } from '../lib/csvCatalogManager';

interface GlobalCatalogItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: CatalogoInsumo | null;
  currentUser: User | null;
  hasMovementsHistory: boolean;
  onSaved: () => void;
  onOpenHistoryModal?: (insumo: CatalogoInsumo) => void;
}

const CATEGORIES_LIST: MaterialCategory[] = [
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

export const GlobalCatalogItemEditModal: React.FC<GlobalCatalogItemEditModalProps> = ({
  isOpen,
  onClose,
  insumo,
  currentUser,
  hasMovementsHistory,
  onSaved,
  onOpenHistoryModal,
}) => {
  const [codigoExterno, setCodigoExterno] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<MaterialCategory>('Argamassas e Selantes');
  const [subcategoria, setSubcategoria] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [precoUnitario, setPrecoUnitario] = useState<string>('0');
  const [ativo, setAtivo] = useState<boolean>(true);
  const [observacoes, setObservacoes] = useState('');
  const [paginaFonte, setPaginaFonte] = useState('');

  // Expandable Extra Technical Specifications
  const [showExtraSpecs, setShowExtraSpecs] = useState(false);
  const [fabricante, setFabricante] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [especificacaoTecnica, setEspecificacaoTecnica] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [normaTecnica, setNormaTecnica] = useState('');
  const [dimensoes, setDimensoes] = useState('');
  const [material, setMaterial] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (insumo) {
      setCodigoExterno(insumo.codigoExterno || '');
      setNome(insumo.nome || '');
      setCategoria(insumo.categoria || 'Argamassas e Selantes');
      setSubcategoria(insumo.subcategoria || '');
      setUnidade(insumo.unidade || 'un');
      setPrecoUnitario(insumo.precoUnitario !== undefined ? insumo.precoUnitario.toString() : '0');
      setAtivo(insumo.ativo !== false);
      setObservacoes(insumo.observacoes || '');
      setPaginaFonte(insumo.paginaFonte || '');

      const extra = insumo.detalhesAdicionais || {};
      setFabricante(extra.fabricante || '');
      setMarca(extra.marca || '');
      setModelo(extra.modelo || '');
      setEspecificacaoTecnica(extra.especificacaoTecnica || '');
      setCodigoBarras(extra.codigoBarras || '');
      setNormaTecnica(extra.normaTecnica || '');
      setDimensoes(extra.dimensoes || '');
      setMaterial(extra.material || '');
    }
  }, [insumo]);

  if (!isOpen || !insumo) return null;

  const isAdminOrAuthorized = canCreateOrEditCatalog(currentUser?.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!codigoExterno.trim()) {
      setErrorMsg('O ID / Código Externo é obrigatório.');
      return;
    }

    if (!nome.trim()) {
      setErrorMsg('O Nome do Insumo é obrigatório.');
      return;
    }

    const parsedPrice = parseFloat(precoUnitario);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setErrorMsg('Informe um Preço Unitário válido.');
      return;
    }

    setIsSaving(true);
    try {
      const detalhesAdicionais: DetalhesAdicionaisInsumo = {
        fabricante: fabricante.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        especificacaoTecnica: especificacaoTecnica.trim(),
        codigoBarras: codigoBarras.trim(),
        normaTecnica: normaTecnica.trim(),
        dimensoes: dimensoes.trim(),
        material: material.trim(),
      };

      const updatedCatalogItem: CatalogoInsumo = {
        ...insumo,
        codigoExterno: codigoExterno.trim(),
        nome: nome.trim(),
        categoria,
        subcategoria: subcategoria.trim(),
        unidade: unidade.trim() || 'un',
        precoUnitario: parsedPrice,
        ativo,
        observacoes: observacoes.trim(),
        paginaFonte: paginaFonte.trim(),
        detalhesAdicionais,
        atualizadoEm: new Date().toISOString(),
      };

      await saveGlobalCatalogItem(updatedCatalogItem, insumo, currentUser);
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(`Erro ao salvar insumo: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F0F11] border border-[#222226] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1F1F21] bg-[#141417] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl text-[#F2A30F]">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Editar Insumo Global
              </h3>
              <p className="text-xs text-[#888888]">
                Alterações afetam este insumo em todos os canteiros cadastrados no sistema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenHistoryModal && (
              <button
                type="button"
                onClick={() => onOpenHistoryModal(insumo)}
                className="bg-[#1C1C20] hover:bg-[#25252A] text-[#CCCCCC] hover:text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#2B2B30] transition-all cursor-pointer"
                title="Ver Histórico de Alterações"
              >
                <History className="w-4 h-4 text-amber-400" />
                Histórico
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#888888] hover:text-white hover:bg-[#1F1F21] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {!isAdminOrAuthorized ? (
            <div className="bg-red-950/40 border border-red-500/30 p-6 rounded-2xl text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Permissão Negada</h4>
              <p className="text-xs text-[#A0A0A0]">
                Somente Administrador tem autorização para editar informações globais do catálogo.
              </p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="bg-red-950/50 border border-red-500/40 p-3.5 rounded-2xl text-red-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <div>{errorMsg}</div>
                </div>
              )}

              {/* Has Movements Warning */}
              {hasMovementsHistory && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl text-amber-300 text-xs flex items-center gap-2.5">
                  <Archive className="w-4 h-4 text-[#F2A30F] shrink-0" />
                  <div>
                    Este insumo possui histórico de movimentações. <strong className="text-white">A exclusão permanente é desabilitada</strong> para manter a rastreabilidade financeira. Caso precise desativá-lo, altere o status para <strong className="text-red-400 font-bold">Inativo</strong>.
                  </div>
                </div>
              )}

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Código Externo */}
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Código Externo / ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={codigoExterno}
                    onChange={(e) => setCodigoExterno(e.target.value)}
                    placeholder="Ex: SIENGE-908"
                    className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-amber-400 font-mono text-xs rounded-xl px-3 py-2.5 outline-none font-bold"
                  />
                </div>

                {/* Nome do Insumo */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Nome do Insumo <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome completo do insumo..."
                    className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-white text-xs rounded-xl px-3 py-2.5 outline-none font-medium"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Categoria <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as MaterialCategory)}
                    className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-white text-xs rounded-xl px-3 py-2.5 outline-none"
                  >
                    {CATEGORIES_LIST.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategoria */}
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Subcategoria
                  </label>
                  <input
                    type="text"
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    placeholder="Ex: ADESIVOS, ADITIVOS E SELANTES"
                    className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-white text-xs rounded-xl px-3 py-2.5 outline-none"
                  />
                </div>

                {/* Unidade */}
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Unidade de Medida <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    placeholder="Ex: kg, m3, un, sc"
                    className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-white text-xs rounded-xl px-3 py-2.5 outline-none font-mono"
                  />
                </div>

                {/* Preço Unitário */}
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Preço Unitário Base (R$)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={precoUnitario}
                    onChange={(e) => setPrecoUnitario(e.target.value)}
                    className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-emerald-400 font-mono text-xs rounded-xl px-3 py-2.5 outline-none font-bold"
                  />
                </div>

                {/* Status Ativo / Inativo */}
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Power className="w-3.5 h-3.5 text-[#F2A30F]" /> Status do Insumo
                  </label>
                  <select
                    value={ativo ? 'true' : 'false'}
                    onChange={(e) => setAtivo(e.target.value === 'true')}
                    className={`w-full border text-xs font-bold rounded-xl px-3 py-2.5 outline-none ${
                      ativo
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                        : 'bg-red-950/40 border-red-500/40 text-red-400'
                    }`}
                  >
                    <option value="true">Sim (Ativo no Catálogo)</option>
                    <option value="false">Não (Inativo / Bloqueado)</option>
                  </select>
                </div>

                {/* Página Fonte */}
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Página Fonte (Catálogo)
                  </label>
                  <input
                    type="text"
                    value={paginaFonte}
                    onChange={(e) => setPaginaFonte(e.target.value)}
                    placeholder="Ex: 11"
                    className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-white text-xs rounded-xl px-3 py-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Observações do Insumo
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Observações técnicas ou especificações adicionais..."
                  className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-white text-xs rounded-xl p-3 outline-none resize-none"
                />
              </div>

              {/* Expandable Technical Specifications */}
              <div className="border border-[#222226] rounded-2xl bg-[#141417] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowExtraSpecs(!showExtraSpecs)}
                  className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-white hover:bg-[#1A1A1E] transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#F2A30F]" /> Especificações Técnicas Expandidas (Fabricante, Marca, Ficha)
                  </span>
                  {showExtraSpecs ? <ChevronUp className="w-4 h-4 text-[#888888]" /> : <ChevronDown className="w-4 h-4 text-[#888888]" />}
                </button>

                {showExtraSpecs && (
                  <div className="p-4 border-t border-[#1F1F21] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-1">Fabricante</label>
                      <input
                        type="text"
                        value={fabricante}
                        onChange={(e) => setFabricante(e.target.value)}
                        placeholder="Ex: Quartzolit / Votorantim"
                        className="w-full bg-[#18181C] border border-[#2A2A30] text-white rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-1">Marca / Linha</label>
                      <input
                        type="text"
                        value={marca}
                        onChange={(e) => setMarca(e.target.value)}
                        placeholder="Ex: Bianco"
                        className="w-full bg-[#18181C] border border-[#2A2A30] text-white rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-1">Modelo / Tipo</label>
                      <input
                        type="text"
                        value={modelo}
                        onChange={(e) => setModelo(e.target.value)}
                        placeholder="Ex: AC-III Especial"
                        className="w-full bg-[#18181C] border border-[#2A2A30] text-white rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-1">Código de Barras / EAN</label>
                      <input
                        type="text"
                        value={codigoBarras}
                        onChange={(e) => setCodigoBarras(e.target.value)}
                        placeholder="Ex: 7891234567890"
                        className="w-full bg-[#18181C] border border-[#2A2A30] text-amber-400 font-mono rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-1">Norma Técnica (ABNT/ISO)</label>
                      <input
                        type="text"
                        value={normaTecnica}
                        onChange={(e) => setNormaTecnica(e.target.value)}
                        placeholder="Ex: NBR 14081"
                        className="w-full bg-[#18181C] border border-[#2A2A30] text-white rounded-lg p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A0A0A0] mb-1">Dimensões / Embalagem</label>
                      <input
                        type="text"
                        value={dimensoes}
                        onChange={(e) => setDimensoes(e.target.value)}
                        placeholder="Ex: Saco 20kg"
                        className="w-full bg-[#18181C] border border-[#2A2A30] text-white rounded-lg p-2 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#1F1F21] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#1F1F21] transition-all cursor-pointer"
            >
              Cancelar
            </button>

            {isAdminOrAuthorized && (
              <button
                type="submit"
                disabled={isSaving}
                className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações Globais'}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
};
