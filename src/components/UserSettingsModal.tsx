import React, { useState } from 'react';
import {
  X,
  Settings,
  Camera,
  Bell,
  Palette,
  ShieldCheck,
  Check,
  Building2,
  HardHat,
  Package,
  Wrench,
  Factory,
} from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogoCustomizer?: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenLogoCustomizer,
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111113] border border-[#222226] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F1D16] to-[#141417] p-6 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Configurações do Sistema</h2>
              <p className="text-xs text-[#9E9E9E]">Personalização e preferências da plataforma</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#888888] hover:text-white bg-[#1F1F24] hover:bg-emerald-600 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-[#D0D0D0]">
          {/* Section 1: Visual Identity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider text-[#888888]">
              <Palette className="w-4 h-4 text-emerald-400" />
              Identidade Visual & Logotipo
            </h4>

            <div className="p-4 rounded-2xl bg-[#161619] border border-[#222226] flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-white block">Logotipo do Topo</span>
                <span className="text-[11px] text-[#888888]">
                  Altere a imagem ou ícone exibido no canto superior esquerdo.
                </span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenLogoCustomizer) onOpenLogoCustomizer();
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-md"
              >
                <Camera className="w-4 h-4" />
                <span>Alterar Logo</span>
              </button>
            </div>
          </div>

          {/* Section 2: Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider text-[#888888]">
              <Bell className="w-4 h-4 text-emerald-400" />
              Notificações e Alertas
            </h4>

            <div className="space-y-2">
              <div
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="p-3.5 rounded-2xl bg-[#161619] border border-[#222226] flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-all"
              >
                <div>
                  <span className="font-bold text-white block">Alertas de Estoque Mínimo</span>
                  <span className="text-[11px] text-[#888888]">Notificar no painel sobre insumos críticos</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors flex items-center ${notificationsEnabled ? 'bg-emerald-600 justify-end' : 'bg-[#2B2B30] justify-start'}`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </div>
              </div>

              <div
                onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                className="p-3.5 rounded-2xl bg-[#161619] border border-[#222226] flex items-center justify-between cursor-pointer hover:border-emerald-500/30 transition-all"
              >
                <div>
                  <span className="font-bold text-white block">Sincronização em Tempo Real</span>
                  <span className="text-[11px] text-[#888888]">Atualizações automáticas do Firestore</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors flex items-center ${autoSyncEnabled ? 'bg-emerald-600 justify-end' : 'bg-[#2B2B30] justify-start'}`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141417] border-t border-[#222226] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
          >
            Salvar e Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
