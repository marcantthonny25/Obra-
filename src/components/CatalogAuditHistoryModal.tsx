import React from 'react';
import { X, History, User, Calendar, FileText, Tag, ArrowRight } from 'lucide-react';
import { CatalogoInsumo, HistoricoAlteracaoInsumo } from '../types';

interface CatalogAuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: CatalogoInsumo | null;
  historyLogs: HistoricoAlteracaoInsumo[];
}

export const CatalogAuditHistoryModal: React.FC<CatalogAuditHistoryModalProps> = ({
  isOpen,
  onClose,
  insumo,
  historyLogs,
}) => {
  if (!isOpen || !insumo) return null;

  const itemLogs = historyLogs
    .filter((log) => log.insumoId === insumo.id || log.insumoCodigoExterno === insumo.codigoExterno)
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F0F11] border border-[#222226] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1F1F21] bg-[#141417] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl text-[#F2A30F]">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Histórico de Alterações do Insumo
              </h3>
              <p className="text-xs text-amber-400 font-mono">
                {insumo.codigoExterno} — {insumo.nome}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#888888] hover:text-white hover:bg-[#1F1F21] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {itemLogs.length === 0 ? (
            <div className="text-center py-10 text-[#777777] text-xs space-y-2">
              <History className="w-8 h-8 mx-auto text-[#44444A]" />
              <p>Nenhum registro de alteração cadastrado para este insumo ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itemLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#151518] border border-[#222226] p-4 rounded-2xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-[#1F1F21] pb-2">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-lg font-bold text-[10px]">
                      {log.tipoAlteracao || 'EDICAO_GLOBAL'}
                    </span>
                    <span className="text-[#888888] text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#A0A0A0]" />
                      {new Date(log.dataHora).toLocaleString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#888888] flex items-center gap-1">
                      <User className="w-3 h-3 text-emerald-400" />
                      Usuário: <strong className="text-white">{log.usuarioNome}</strong>
                    </span>
                    <span className="text-[#A0A0A0] font-medium">{log.campoAlterado}</span>
                  </div>

                  <div className="bg-[#1A1A1E] p-2.5 rounded-xl border border-[#222226] space-y-1 text-[11px]">
                    {log.informacaoAnterior && (
                      <div className="text-red-400 line-through truncate" title={log.informacaoAnterior}>
                        Anterior: {log.informacaoAnterior}
                      </div>
                    )}
                    {log.informacaoNova && (
                      <div className="text-emerald-400 font-medium truncate" title={log.informacaoNova}>
                        Novo: {log.informacaoNova}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1F1F21] bg-[#141417] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#1A1A1E] hover:bg-[#25252A] text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
