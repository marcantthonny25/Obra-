import React from 'react';
import {
  X,
  User as UserIcon,
  ShieldCheck,
  Mail,
  Building2,
  Lock,
  KeyRound,
  CheckCircle2,
  Calendar,
  BadgeCheck,
  HardHat,
} from 'lucide-react';
import type { User } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
}) => {
  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111113] border border-[#222226] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0F1D16] to-[#141417] p-6 border-b border-emerald-500/20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-[#888888] hover:text-white bg-[#1F1F24] hover:bg-emerald-600 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/60">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-1 rounded-full border border-black shadow">
                <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>{currentUser.role}</span>
              </div>
              <h2 className="text-xl font-extrabold text-white">{currentUser.name}</h2>
              <p className="text-xs text-[#9E9E9E]">{currentUser.email}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs text-[#D0D0D0]">
          {/* User Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#161619] border border-[#222226] space-y-1">
              <span className="text-[10px] text-[#888888] uppercase font-bold tracking-wider block flex items-center gap-1">
                <Mail className="w-3 h-3 text-emerald-400" />
                E-mail Corporativo
              </span>
              <span className="font-semibold text-white block truncate">{currentUser.email}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#161619] border border-[#222226] space-y-1">
              <span className="text-[10px] text-[#888888] uppercase font-bold tracking-wider block flex items-center gap-1">
                <Building2 className="w-3 h-3 text-emerald-400" />
                Canteiro Vinculado
              </span>
              <span className="font-semibold text-white block truncate">
                {currentUser.worksiteAssigned || 'Acesso Global (Todas)'}
              </span>
            </div>
          </div>

          {/* Permissions Overview */}
          <div className="p-4 rounded-2xl bg-[#161619] border border-[#222226] space-y-2.5">
            <h4 className="text-xs font-bold text-white flex items-center gap-2 border-b border-[#222226] pb-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Nível de Acesso e Permissões</span>
            </h4>

            <div className="space-y-1.5 text-[11px] text-[#A0A0A0]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Lançar e auditar movimentações de estoque</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Visualizar catálogo de insumos e relatórios de saldo</span>
              </div>
              {currentUser.role === 'Administrador' && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Gestão completa de usuários, canteiros e permissões</span>
                </div>
              )}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px]">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Sessão protegida e sincronizada em tempo real via Firestore.</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#141417] border-t border-[#222226] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 font-bold text-xs transition-colors cursor-pointer"
          >
            Sair da Conta
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
