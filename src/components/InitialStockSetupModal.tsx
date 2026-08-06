import React, { useState } from 'react';
import { Building2, AlertCircle, CheckCircle2, ShieldCheck, MapPin, FileText } from 'lucide-react';
import { CatalogoInsumo, WorkSite, User, EstoqueCanteiro } from '../types';
import { saveWorksiteStockConfig } from '../lib/csvCatalogManager';

interface InitialStockSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: CatalogoInsumo | null;
  worksite: WorkSite | null;
  currentUser: User | null;
  onSuccess: (newStockConfig: EstoqueCanteiro) => void;
}

export const InitialStockSetupModal: React.FC<InitialStockSetupModalProps> = ({
  isOpen,
  onClose,
  insumo,
  worksite,
  currentUser,
  onSuccess,
}) => {
  const [minStock, setMinStock] = useState<string>('10');
  const [location, setLocation] = useState<string>('Almoxarifado Principal');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !insumo || !worksite) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsedMin = parseFloat(minStock);
    if (isNaN(parsedMin) || parsedMin < 0) {
      setErrorMsg('Informe um valor numérico válido para o Estoque Mínimo (maior ou igual a 0).');
      return;
    }

    setIsSaving(true);
    try {
      const stockId = `${worksite.id}_${insumo.id}`;
      const now = new Date().toISOString();

      const newStockConfig: EstoqueCanteiro = {
        id: stockId,
        canteiroId: worksite.id,
        insumoId: insumo.id,
        estoqueAtual: 0,
        estoqueMinimo: parsedMin,
        localArmazenamento: location.trim() || 'Almoxarifado Principal',
        observacoesDoCanteiro: notes.trim(),
        criadoEm: now,
        atualizadoEm: now,
      };

      await saveWorksiteStockConfig(newStockConfig, currentUser);
      onSuccess(newStockConfig);
    } catch (err: any) {
      setErrorMsg(`Erro ao salvar configuração do canteiro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F0F11] border border-amber-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1F1F21] bg-[#141417] flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl text-[#F2A30F]">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Configuração Inicial no Canteiro</h3>
            <p className="text-xs text-[#888888]">
              Defina as regras de estoque para este insumo na obra alocada
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="bg-red-950/50 border border-red-500/40 p-3.5 rounded-2xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Context Info */}
          <div className="bg-[#151518] border border-[#222226] p-4 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#888888]">
              <span>Canteiro de Obra:</span>
              <strong className="text-white font-bold">{worksite.name}</strong>
            </div>
            <div className="flex justify-between items-center text-[#888888]">
              <span>Insumo Global:</span>
              <strong className="text-amber-400 font-mono font-bold">{insumo.codigoExterno} - {insumo.nome}</strong>
            </div>
            <div className="flex justify-between items-center text-[#888888]">
              <span>Unidade de Medida:</span>
              <strong className="text-white">{insumo.unidade}</strong>
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-200 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#F2A30F] shrink-0 mt-0.5" />
            <div>
              Este insumo ainda não possui parâmetros configurados para o canteiro <strong>{worksite.name}</strong>. Defina o estoque mínimo abaixo antes de prosseguir com a movimentação.
            </div>
          </div>

          {/* Estoque Mínimo Mandatory */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
              Estoque Mínimo no Canteiro <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                required
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="Ex: 50"
                className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-white text-sm rounded-xl px-4 py-3 outline-none transition-all font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#888888] font-bold">
                {insumo.unidade}
              </span>
            </div>
            <p className="text-[11px] text-[#777777] mt-1">
              Sinaliza alerta de reposição crítica caso o saldo do canteiro fique igual ou inferior a este valor.
            </p>
          </div>

          {/* Local de Armazenamento */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F2A30F]" /> Local de Armazenamento no Canteiro
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Galpão A - Prateleira 3"
              className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-white text-sm rounded-xl px-4 py-2.5 outline-none transition-all"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#F2A30F]" /> Observações do Canteiro
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Orientações específicas para este canteiro..."
              className="w-full bg-[#18181C] border border-[#2A2A30] focus:border-[#F2A30F] focus:ring-1 focus:ring-[#F2A30F] text-white text-xs rounded-xl p-3 outline-none transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#1F1F21]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#1F1F21] transition-all cursor-pointer"
            >
              Cancelar Movimentação
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              {isSaving ? 'Salvando...' : 'Salvar e Continuar Lançamento'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
