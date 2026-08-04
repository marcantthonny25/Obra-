import React, { useState } from 'react';
import {
  HardHat,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  Building,
  KeyRound,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  UserPlus,
  Trash2
} from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  users: User[];
  onLoginSuccess: (user: User) => void;
  onRegisterUser: (newUser: User) => void;
  onDeleteUser?: (userId: string) => void;
  isGateMode?: boolean; // If true, force full screen gate without close button unless logged in
}

const ROLES_LIST: { role: UserRole; desc: string }[] = [
  { role: 'Coordenador de Obra', desc: 'Acesso total e visão global do estoque de todos os canteiros' },
  { role: 'Engenheiro/a', desc: 'Acesso total e visão global do estoque de todos os canteiros' },
  { role: 'Engenheira/o', desc: 'Acesso total e visão global do estoque de todos os canteiros' },
  { role: 'Almoxarife', desc: 'Lançamentos de entrada, saída e conferência de lote' },
  { role: 'Mestre de Obras', desc: 'Requisição de insumos por etapa do canteiro' },
  { role: 'Engenheiro Residente', desc: 'Aprovação de medições e relatórios financeiros' },
  { role: 'Gerente de Compras', desc: 'Geração de ordens de cotação e orçamento' },
  { role: 'Administrador', desc: 'Acesso irrestrito a todas as funcionalidades' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess,
  onRegisterUser,
  onDeleteUser,
  isGateMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login Form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Almoxarife');
  const [regWorksite, setRegWorksite] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [forgotPasswordView, setForgotPasswordView] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  if (!isOpen) return null;

  const hasAdmin = users.some(
    (u) => (u.role === 'Administrador' || u.role?.toLowerCase() === 'admin') && u.status !== 'INATIVO'
  );

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = loginEmail.trim().toLowerCase();

    const userFound = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === loginPassword
    );

    if (!userFound) {
      setErrorMsg('E-mail ou senha incorretos. Verifique suas credenciais.');
      return;
    }

    if (userFound.status === 'INATIVO') {
      setErrorMsg('Sua conta está desativada. Entre em contato com o Administrador.');
      return;
    }

    setSuccessMsg(`Bem-vindo(a) de volta, ${userFound.name}!`);
    setTimeout(() => {
      onLoginSuccess(userFound);
      if (onClose) onClose();
    }, 500);
  };

  // Handle Register Submit (Initial Admin Setup only if no admin exists)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (hasAdmin) {
      setErrorMsg('O cadastro público está desativado. Solicite sua conta ao Administrador.');
      return;
    }

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setErrorMsg('Este e-mail já está cadastrado no sistema. Faça login.');
      return;
    }

    if (regPassword.length < 3) {
      setErrorMsg('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: regName.trim(),
      email: cleanEmail,
      password: regPassword,
      role: 'Administrador', // First registered user is automatically Administrator
      status: 'ATIVO',
      createdAt: new Date().toISOString(),
      worksiteAssigned: regWorksite.trim() || 'Todas as Obras',
    };

    onRegisterUser(newUser);
    setSuccessMsg(`Conta de Administrador criada com sucesso! Acessando como ${newUser.name}...`);

    setTimeout(() => {
      onLoginSuccess(newUser);
      if (onClose) onClose();
    }, 600);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetEmailSent(true);
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto ${
        isGateMode
          ? 'bg-cover bg-center bg-no-repeat'
          : 'bg-black/80 backdrop-blur-md'
      }`}
      style={
        isGateMode
          ? {
              backgroundImage: "url('/hogar-home-hero.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      {/* Camada escura com no máximo 30% de opacidade quando em tela cheia (GateMode) */}
      {isGateMode && <div className="absolute inset-0 bg-black/30 pointer-events-none" />}

      <div className="relative z-10 bg-[#0F0F11]/90 backdrop-blur-md rounded-3xl shadow-2xl border border-[#222226] w-full max-w-md sm:max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-white">
        {/* Header Header */}
        <div className="bg-[#151517] border-b border-[#222226] p-6 text-center relative">
          {!isGateMode && onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 text-[#888888] hover:text-white rounded-xl hover:bg-[#222226] transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex items-center justify-center p-3.5 bg-[#F2A30F]/15 border border-[#F2A30F]/30 rounded-2xl mb-3">
            <HardHat className="w-8 h-8 text-[#F2A30F]" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-[#F2A30F] block mb-1">
            Controle de Estoque
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center justify-center gap-1.5 text-emerald-400">
            Hogar Empreendimentos
          </h2>
          <p className="text-xs text-[#888888] mt-1.5 max-w-sm mx-auto">
            Sistema de Gestão de Insumos, Movimentações e Canteiros de Obras
          </p>

          {/* Tab Switcher */}
          {!forgotPasswordView && (
            <div className="mt-5 max-w-sm mx-auto">
              {!hasAdmin ? (
                <div className="flex bg-[#09090A] border border-[#222226] p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'login'
                        ? 'bg-[#F2A30F] text-black shadow-md'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Entrar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeTab === 'register'
                        ? 'bg-[#F2A30F] text-black shadow-md'
                        : 'text-[#888888] hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Criar 1º Admin
                  </button>
                </div>
              ) : (
                <div className="bg-[#151517] border border-[#222226] p-2.5 rounded-xl text-[11px] text-[#A0A0A0] flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Acesso Restrito: Novos usuários são criados pelo Administrador</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-red-950/50 border border-red-500/40 text-red-300 rounded-xl flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 rounded-xl flex items-start gap-2.5 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {forgotPasswordView ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                  <KeyRound className="w-4 h-4 text-[#F2A30F]" />
                  Recuperação de Senha
                </h3>
                <p className="text-xs text-[#888888]">
                  Informe seu e-mail cadastrado para receber instruções de redefinição de acesso.
                </p>
              </div>

              {resetEmailSent ? (
                <div className="p-4 bg-[#151517] border border-[#222226] rounded-xl text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-[#CCCCCC]">
                    Enviamos um link de redefinição simulado para o e-mail informado.
                  </p>
                  <button
                    onClick={() => {
                      setForgotPasswordView(false);
                      setResetEmailSent(false);
                    }}
                    className="px-4 py-2 bg-[#1F1F21] hover:bg-[#2A2A2E] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Voltar para a Tela de Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
                      E-mail Cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="seu.email@empresa.com"
                        className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotPasswordView(false)}
                      className="flex-1 py-2.5 border border-[#222226] bg-[#151517] hover:bg-[#1F1F21] text-xs font-bold rounded-xl text-[#AAAAAA] hover:text-white transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#F2A30F] hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Enviar Link
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : activeTab === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1.5">
                  E-mail do Usuário
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="ex: carlos.almoxarife@obras.com"
                    className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] focus:border-[#F2A30F] outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#A0A0A0]">Senha</label>
                  <button
                    type="button"
                    onClick={() => setForgotPasswordView(true)}
                    className="text-[11px] text-[#F2A30F] hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] focus:border-[#F2A30F] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#666666] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#888888] hover:text-[#CCCCCC]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-[#333333] bg-[#151517] text-[#F2A30F] focus:ring-0 cursor-pointer"
                  />
                  Lembrar minhas credenciais
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Acessar Painel de Estoque</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="ex: Eng. Ana Paula Souza"
                    className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                  E-mail de Acesso *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ex: ana.souza@construtora.com"
                    className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Criar senha"
                      className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-3 text-[#666666] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repetir senha"
                      className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-3 text-[#666666] hover:text-white"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                  Cargo / Função na Obra *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full bg-[#151517] border border-[#222226] rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-[#F2A30F] outline-none"
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.role} value={r.role} className="bg-[#151517] text-white">
                      {r.role} ({r.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                  Obra / Almoxarifado Alocado
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#666666] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={regWorksite}
                    onChange={(e) => setRegWorksite(e.target.value)}
                    placeholder="ex: Residencial Horizon / Central"
                    className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <UserCheck className="w-4 h-4" />
                Cadastrar e Acessar Sistema
              </button>
            </form>
          )}
        </div>

        {/* Footer Security badge */}
        <div className="bg-[#09090A] border-t border-[#222226] px-6 py-3.5 text-center flex items-center justify-center gap-2 text-[11px] text-[#777777]">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Sessão segura criptografada com controle de acesso corporativo</span>
        </div>
      </div>
    </div>
  );
};
