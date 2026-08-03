import React, { useState } from 'react';
import { KeyRound, Lock, ShieldAlert, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { User } from '../types';

interface FirstAccessPasswordModalProps {
  user: User;
  onPasswordChanged: (newPassword: string) => void;
}

export const FirstAccessPasswordModal: React.FC<FirstAccessPasswordModalProps> = ({
  user,
  onPasswordChanged,
}) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (user.password && currentPass !== user.password) {
      setErrorMsg('A senha atual (temporária) informada está incorreta.');
      return;
    }

    if (newPass.length < 4) {
      setErrorMsg('A nova senha deve possuir no mínimo 4 caracteres.');
      return;
    }

    if (newPass === currentPass) {
      setErrorMsg('A nova senha deve ser diferente da senha temporária.');
      return;
    }

    if (newPass !== confirmPass) {
      setErrorMsg('A confirmação da nova senha não coincide.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onPasswordChanged(newPass);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F0F11] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5 animate-in zoom-in-95">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-amber-400">
            <KeyRound className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 block font-mono">
            Primeiro Acesso / Redefinição Obrigatória
          </span>
          <h2 className="text-xl font-bold text-white">
            Olá, {user.name}!
          </h2>
          <p className="text-xs text-[#888888] max-w-xs mx-auto">
            Por medida de segurança corporativa, você deve alterar sua senha antes de prosseguir para o sistema.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-[#A0A0A0] mb-1">
              Senha Temporária Atual *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Informe a senha que recebeu"
                className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#A0A0A0] mb-1">
              Nova Senha Pessoal *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Crie sua nova senha segura"
                className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-[#A0A0A0] mb-1">
              Confirmar Nova Senha *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isSubmitting ? (
              <span>Salvando nova senha...</span>
            ) : (
              <>
                <span>Salvar Nova Senha e Acessar Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-[#666666] flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Acesso criptografado e registrado para {user.email}</span>
        </div>
      </div>
    </div>
  );
};
