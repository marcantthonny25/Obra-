import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  KeyRound,
  Edit2,
  Trash2,
  Building2,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  X,
  BadgeAlert,
  Database,
} from 'lucide-react';
import { User, UserRole, UserStatus, WorkSite } from '../types';

interface UsersManagementViewProps {
  users: User[];
  worksites: WorkSite[];
  currentUser: User | null;
  onRegisterUser: (newUser: User) => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onSeedDemoData?: () => void;
}

const ROLES_LIST: { role: UserRole; desc: string }[] = [
  { role: 'Administrador', desc: 'Acesso total, gestão de usuários, obras e relatórios' },
  { role: 'Coordenador de Obra', desc: 'Visão global de todas as obras (somente leitura)' },
  { role: 'Engenheiro/a', desc: 'Visão global de todas as obras (somente leitura)' },
  { role: 'Engenheiro Residente', desc: 'Acompanhamento e relatórios da obra alocada' },
  { role: 'Almoxarife', desc: 'Lançamentos de entrada, saída e movimentações de estoque' },
  { role: 'Mestre de Obras', desc: 'Requisição e consulta de insumos da obra alocada' },
  { role: 'Gerente de Compras', desc: 'Consulta de níveis de estoque e cotações' },
];

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  users,
  worksites,
  currentUser,
  onRegisterUser,
  onUpdateUser,
  onDeleteUser,
  onSeedDemoData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Reset Password Modal
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Almoxarife');
  const [formStatus, setFormStatus] = useState<UserStatus>('ATIVO');
  const [formWorksite, setFormWorksite] = useState<string>('Todas as Obras');
  const [formMustChangePass, setFormMustChangePass] = useState(true);

  // Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('Almoxarife');
    setFormStatus('ATIVO');
    setFormWorksite(worksites[0]?.name || 'Todas as Obras');
    setFormMustChangePass(true);
    setFeedback(null);
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role);
    setFormStatus(user.status || 'ATIVO');
    setFormWorksite(user.worksiteAssigned || 'Todas as Obras');
    setFormMustChangePass(user.mustChangePassword || false);
    setFeedback(null);
    setIsFormOpen(true);
  };

  // Submit User Form
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formName.trim() || !formEmail.trim()) {
      setFeedback({ type: 'error', msg: 'Nome e E-mail são obrigatórios.' });
      return;
    }

    const isRestrictedRole =
      formRole === 'Almoxarife' ||
      formRole === 'Mestre de Obras' ||
      formRole.toLowerCase().includes('almoxarife') ||
      formRole.toLowerCase().includes('mestre');

    if (isRestrictedRole && (!formWorksite || formWorksite === 'Todas as Obras')) {
      setFeedback({
        type: 'error',
        msg: `Para o cargo de ${formRole}, é OBRIGATÓRIO selecionar uma obra específica para vinculação no Firestore.`,
      });
      return;
    }

    const cleanEmail = formEmail.trim().toLowerCase();
    const matchedWorksite = worksites.find(
      (w) => w.name === formWorksite || w.id === formWorksite
    );

    if (!editingUser) {
      // Check duplicate
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        setFeedback({ type: 'error', msg: 'Este e-mail já está cadastrado no sistema.' });
        return;
      }

      if (!formPassword || formPassword.length < 3) {
        setFeedback({ type: 'error', msg: 'A senha inicial deve ter pelo menos 3 caracteres.' });
        return;
      }

      const newUser: User = {
        id: `usr-${Date.now()}`,
        name: formName.trim(),
        email: cleanEmail,
        password: formPassword,
        role: formRole,
        status: formStatus,
        mustChangePassword: formMustChangePass,
        createdAt: new Date().toISOString(),
        worksiteAssigned: formWorksite,
        worksiteId: matchedWorksite?.id,
      };

      onRegisterUser(newUser);
      setFeedback({ type: 'success', msg: `Usuário ${newUser.name} cadastrado com sucesso!` });
      setTimeout(() => setIsFormOpen(false), 800);
    } else {
      // Edit user
      const updatedUser: User = {
        ...editingUser,
        name: formName.trim(),
        email: cleanEmail,
        role: formRole,
        status: formStatus,
        worksiteAssigned: formWorksite,
        worksiteId: matchedWorksite?.id,
        mustChangePassword: formMustChangePass,
      };

      if (formPassword && formPassword.trim().length >= 3) {
        updatedUser.password = formPassword.trim();
      }

      onUpdateUser(updatedUser);
      setFeedback({ type: 'success', msg: `Cadastro de ${updatedUser.name} atualizado.` });
      setTimeout(() => setIsFormOpen(false), 800);
    }
  };

  // Toggle user status active/inactive
  const handleToggleStatus = (user: User) => {
    const nextStatus: UserStatus = user.status === 'INATIVO' ? 'ATIVO' : 'INATIVO';
    const updated = { ...user, status: nextStatus };
    onUpdateUser(updated);
  };

  // Confirm Reset Password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser || !newTempPassword || newTempPassword.length < 3) return;

    const updated = {
      ...resetPassUser,
      password: newTempPassword,
      mustChangePassword: true,
    };
    onUpdateUser(updated);
    setResetPassUser(null);
    setNewTempPassword('');
    alert(`Senha temporária redefinida com sucesso para ${updated.name}. O usuário precisará alterá-la no primeiro acesso.`);
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.worksiteAssigned && u.worksiteAssigned.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || (u.status || 'ATIVO') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Admin Security Banner */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl text-emerald-300 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-sm block">Módulo de Gestão de Usuários e Permissões</span>
            <span>
              Somente Administradores podem cadastrar, desativar usuários e redefinir credenciais. O cadastro público pela tela de login está bloqueado por segurança.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(currentUser?.role === 'Administrador' || currentUser?.role?.toLowerCase() === 'admin') && onSeedDemoData && (
            <button
              onClick={onSeedDemoData}
              className="bg-[#151517] hover:bg-[#1F1F21] text-amber-400 border border-amber-500/30 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              title="Carga manual dos dados de demonstração iniciais"
            >
              <Database className="w-4 h-4 text-amber-400" />
              Carregar Dados de Exemplo
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Header & Controls */}
      <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#F2A30F]" />
              Usuários Cadastrados ({filteredUsers.length})
            </h2>
            <p className="text-xs text-[#888888]">
              Controle de contas, perfis corporativos e atrelando obras aos usuários
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou obra..."
              className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#555555] focus:ring-1 focus:ring-[#F2A30F] outline-none"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#151517] border border-[#222226] rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-[#F2A30F] outline-none"
          >
            <option value="ALL">Todos os Cargos</option>
            {ROLES_LIST.map((r) => (
              <option key={r.role} value={r.role}>
                {r.role}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#151517] border border-[#222226] rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-[#F2A30F] outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ATIVO">Apenas Ativos</option>
            <option value="INATIVO">Apenas Desativados</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#151517] text-[#888888] font-semibold border-b border-[#222226]">
                <th className="p-3.5 pl-5">Usuário / E-mail</th>
                <th className="p-3.5">Cargo / Perfil</th>
                <th className="p-3.5">Obra Alocada</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Primeiro Acesso</th>
                <th className="p-3.5 text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F21] text-[#CCCCCC]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#666666]">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isInactive = u.status === 'INATIVO';
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className={`hover:bg-[#151517]/60 transition-colors ${isInactive ? 'opacity-60' : ''}`}>
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'Administrador'
                              ? 'bg-amber-500/20 text-[#F2A30F] border border-amber-500/30'
                              : 'bg-[#222226] text-white'
                          }`}>
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#777777] font-mono">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                          u.role === 'Administrador'
                            ? 'bg-amber-500/10 text-[#F2A30F] border-amber-500/30'
                            : u.role === 'Almoxarife'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>

                      <td className="p-3.5 text-[#AAAAAA]">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Building2 className="w-3.5 h-3.5 text-[#666666]" />
                          <span>{u.worksiteAssigned || 'Todas as Obras'}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {isInactive ? (
                          <span className="inline-flex items-center gap-1 bg-red-950/60 border border-red-500/30 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            <UserX className="w-3 h-3" />
                            DESATIVADO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            <UserCheck className="w-3 h-3" />
                            ATIVO
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        {u.mustChangePassword ? (
                          <span className="inline-flex items-center gap-1 bg-amber-950/60 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">
                            <BadgeAlert className="w-3 h-3" />
                            Mudar Senha
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#666666]">OK</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset password button */}
                          <button
                            onClick={() => setResetPassUser(u)}
                            className="p-1.5 text-[#888888] hover:text-[#F2A30F] hover:bg-[#1F1F21] rounded-lg transition-colors cursor-pointer"
                            title="Redefinir Senha"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Inactive status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isInactive
                                ? 'text-emerald-400 hover:bg-emerald-950/50'
                                : 'text-amber-400 hover:bg-amber-950/50'
                            } ${isCurrent ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title={isInactive ? 'Ativar Usuário' : 'Desativar Usuário'}
                          >
                            {isInactive ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-[#888888] hover:text-white hover:bg-[#1F1F21] rounded-lg transition-colors cursor-pointer"
                            title="Editar Usuário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir o usuário ${u.name}?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            disabled={isCurrent}
                            className={`p-1.5 text-[#888888] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer ${
                              isCurrent ? 'opacity-30 cursor-not-allowed' : ''
                            }`}
                            title="Excluir Usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CREATE / EDIT USER */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0F0F11] border border-[#222226] rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 animate-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between border-b border-[#222226] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#F2A30F]/15 border border-[#F2A30F]/30 rounded-xl text-[#F2A30F]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {editingUser ? `Editar Usuário: ${editingUser.name}` : 'Cadastrar Novo Usuário'}
                  </h3>
                  <p className="text-xs text-[#888888]">Defina as credenciais, perfil e obra de alocação</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 text-[#888888] hover:text-white rounded-xl hover:bg-[#1F1F21]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'error'
                    ? 'bg-red-950/60 border border-red-500/40 text-red-300'
                    : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                }`}
              >
                {feedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{feedback.msg}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A0A0A0] font-medium mb-1">Nome Completo *</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ex: Eng. Eduardo Vasconcelos"
                    className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-[#555555] focus:ring-1 focus:ring-[#F2A30F] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] font-medium mb-1">E-mail Corporativo *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ex: eduardo@hogarempreendimentos.com"
                    className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-[#555555] focus:ring-1 focus:ring-[#F2A30F] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A0A0A0] font-medium mb-1">
                    {editingUser ? 'Nova Senha (opcional)' : 'Senha Inicial / Temporária *'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder={editingUser ? 'Manter senha atual' : '••••••••'}
                      className="w-full bg-[#151517] border border-[#222226] rounded-xl pl-9 pr-3 py-2.5 text-white placeholder-[#555555] focus:ring-1 focus:ring-[#F2A30F] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A0A0A0] font-medium mb-1">Status do Usuário</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                    className="w-full bg-[#151517] border border-[#222226] rounded-xl p-2.5 text-white focus:ring-1 focus:ring-[#F2A30F] outline-none"
                  >
                    <option value="ATIVO">ATIVO (Acesso liberado)</option>
                    <option value="INATIVO">INATIVO (Acesso bloqueado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] font-medium mb-1">Cargo / Função *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full bg-[#151517] border border-[#222226] rounded-xl p-2.5 text-white focus:ring-1 focus:ring-[#F2A30F] outline-none"
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.role} — ({r.desc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#A0A0A0] font-medium mb-1">
                  Obra Vinculada {formRole === 'Almoxarife' || formRole === 'Mestre de Obras' ? '(OBRIGATÓRIO *)' : '(Opcional)'}
                </label>
                <select
                  value={formWorksite}
                  onChange={(e) => setFormWorksite(e.target.value)}
                  className={`w-full bg-[#151517] border rounded-xl p-2.5 text-white outline-none ${
                    (formRole === 'Almoxarife' || formRole === 'Mestre de Obras') && (!formWorksite || formWorksite === 'Todas as Obras')
                      ? 'border-amber-500 focus:ring-1 focus:ring-amber-500'
                      : 'border-[#222226] focus:ring-1 focus:ring-[#F2A30F]'
                  }`}
                >
                  {formRole !== 'Almoxarife' && formRole !== 'Mestre de Obras' && (
                    <option value="Todas as Obras">Todas as Obras (Acesso Global / Sem Restrição)</option>
                  )}
                  {worksites.map((w) => (
                    <option key={w.id} value={w.name}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
                {(formRole === 'Almoxarife' || formRole === 'Mestre de Obras') && (
                  <p className="text-[11px] text-amber-400 mt-1">
                    * O cargo de {formRole} exige vinculação obrigatória a um canteiro de obras específico.
                  </p>
                )}
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-[#CCCCCC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formMustChangePass}
                    onChange={(e) => setFormMustChangePass(e.target.checked)}
                    className="rounded border-[#333333] bg-[#151517] text-[#F2A30F] focus:ring-0"
                  />
                  Obrigatório alterar a senha no primeiro acesso
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#222226]">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 border border-[#222226] bg-[#151517] hover:bg-[#1F1F21] text-xs font-bold rounded-xl text-[#A0A0A0] hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F2A30F] hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-lg"
                >
                  {editingUser ? 'Atualizar Usuário' : 'Salvar Novo Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F0F11] border border-[#222226] rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-[#222226] pb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F2A30F]" />
                Redefinir Senha de {resetPassUser.name}
              </h3>
              <button onClick={() => setResetPassUser(null)} className="text-[#888888] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <p className="text-[#888888]">
                Informe uma senha temporária. O usuário será obrigado a criar uma nova senha ao realizar login.
              </p>

              <div>
                <label className="block text-[#A0A0A0] font-medium mb-1">Nova Senha Temporária *</label>
                <input
                  type="text"
                  required
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  placeholder="ex: Hogar2026@"
                  className="w-full bg-[#151517] border border-[#222226] rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-[#F2A30F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-4 py-2 border border-[#222226] bg-[#151517] text-xs font-bold rounded-xl text-[#AAAAAA]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F2A30F] hover:bg-amber-400 text-black text-xs font-bold rounded-xl"
                >
                  Confirmar Redefinição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
