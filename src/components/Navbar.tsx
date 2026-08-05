import React, { useState, useRef, useEffect } from 'react';
import {
  Package,
  ArrowRightLeft,
  Building2,
  Sparkles,
  BarChart3,
  AlertTriangle,
  Plus,
  HardHat,
  User as UserIcon,
  LogOut,
  UserPlus,
  ChevronDown,
  ShieldCheck,
  Building,
  Camera,
  Upload,
  Trash2,
  X,
  Check,
  Image as ImageIcon,
  Wrench,
  Factory,
  Users,
  Lock,
  Home,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { MaterialItem, User, WorkSite, canManageUsers, canCreateOrEditMovements, isWorksiteLockedRole } from '../types';
import { UserProfileModal } from './UserProfileModal';
import { UserSettingsModal } from './UserSettingsModal';

interface NavbarProps {
  activeTab: 'home' | 'materials' | 'movements' | 'worksites' | 'ai' | 'analytics' | 'users';
  setActiveTab: (tab: 'home' | 'materials' | 'movements' | 'worksites' | 'ai' | 'analytics' | 'users') => void;
  materials: MaterialItem[];
  worksites?: WorkSite[];
  selectedWorksiteId: string;
  onSelectWorksite: (worksiteId: string) => void;
  onOpenNewMovement: () => void;
  currentUser: User | null;
  users?: User[];
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onDeleteUser?: (userId: string) => void;
}

interface LogoData {
  type: 'icon' | 'image';
  value: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  materials,
  worksites = [],
  selectedWorksiteId,
  onSelectWorksite,
  onOpenNewMovement,
  currentUser,
  users = [],
  onOpenAuthModal,
  onLogout,
  onDeleteUser,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Theme state ('dark' | 'light') persisted in localStorage
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('hogar_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('hogar_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };

  const isLockedWorksite = currentUser ? isWorksiteLockedRole(currentUser.role) : false;
  const canMove = currentUser ? canCreateOrEditMovements(currentUser.role) : true;

  // Logo state loaded from LocalStorage
  const [logoData, setLogoData] = useState<LogoData>(() => {
    const saved = localStorage.getItem('hogar_custom_logo');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.value) return parsed;
      } catch (e) {}
    }
    return { type: 'icon', value: 'HardHat' };
  });

  // Modal logo inputs state
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [fileError, setFileError] = useState('');

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Save logo to LocalStorage
  const handleSaveLogo = (newLogo: LogoData) => {
    setLogoData(newLogo);
    localStorage.setItem('hogar_custom_logo', JSON.stringify(newLogo));
    setIsLogoModalOpen(false);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setFileError('A imagem deve ter no máximo 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleSaveLogo({ type: 'image', value: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Calculate critical items count
  const criticalCount = materials.filter((m) => m.quantity <= m.minQuantity).length;
  const totalStockValue = materials.reduce((acc, m) => acc + m.quantity * m.avgUnitPrice, 0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#0F0F11] border-b border-[#1F1F21] text-white sticky top-0 z-40 shadow-sm">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          {/* Custom Logo Button Container */}
          <div
            onClick={() => setIsLogoModalOpen(true)}
            className="relative group cursor-pointer"
            title="Clique para trocar a foto / logotipo do canto superior esquerdo"
          >
            <div className="bg-[#F2A30F] text-black p-2 rounded-xl shadow-md flex items-center justify-center font-bold w-11 h-11 overflow-hidden transition-transform group-hover:scale-105">
              {logoData.type === 'image' ? (
                <img src={logoData.value} alt="Logo Hogar Empreendimentos" className="w-full h-full object-cover rounded-lg" />
              ) : logoData.value === 'Building2' ? (
                <Building2 className="w-6 h-6 text-black" />
              ) : logoData.value === 'Package' ? (
                <Package className="w-6 h-6 text-black" />
              ) : logoData.value === 'ShieldCheck' ? (
                <ShieldCheck className="w-6 h-6 text-black" />
              ) : logoData.value === 'Factory' ? (
                <Factory className="w-6 h-6 text-black" />
              ) : logoData.value === 'Wrench' ? (
                <Wrench className="w-6 h-6 text-black" />
              ) : (
                <HardHat className="w-6 h-6 text-black" />
              )}
            </div>

            {/* Hover Camera Icon Badge */}
            <div className="absolute -bottom-1 -right-1 bg-black text-[#F2A30F] border border-[#F2A30F] p-1 rounded-full text-[10px] shadow-md opacity-80 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3 h-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-emerald-400 font-sans">
                Hogar Empreendimentos
              </h1>
              <span className="bg-[#1F1F21] text-[#F2A30F] border border-[#333333] text-xs font-semibold px-2 py-0.5 rounded-full">
                {currentUser ? `Perfil: ${currentUser.role}` : 'Gestão de Obras'}
              </span>
            </div>
            <p className="text-xs text-[#888888]">Gestão de Almoxarifados e Estoque Isolado por Obra</p>
          </div>
        </div>

        {/* Worksite Active Selector Bar + Stock KPI summary badges */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 md:pb-0 text-xs">
          {/* Worksite Active Selector Control */}
          {isLockedWorksite ? (
            <div
              className="bg-[#18181B] border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-2 shrink-0 shadow-sm"
              title="Sua conta está vinculada exclusivamente a este canteiro de obras"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="text-[#888888] block text-[9px] uppercase font-bold">Obra Vinculada (Fixa)</span>
                <span className="font-bold text-amber-300 truncate max-w-[150px] inline-block">
                  {currentUser?.worksiteAssigned || 'Canteiro Restrito'}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#151517] border border-[#222226] hover:border-[#F2A30F]/40 px-3 py-1 rounded-xl flex items-center gap-2 shrink-0 transition-colors">
              <Building2 className="w-4 h-4 text-[#F2A30F] shrink-0" />
              <div className="text-[11px]">
                <span className="text-[#888888] block text-[9px] uppercase font-bold">Filtrar por Obra</span>
                <select
                  value={selectedWorksiteId}
                  onChange={(e) => onSelectWorksite(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer pr-1"
                >
                  <option value="ALL" className="bg-[#0F0F11] text-white">Todas as Obras (Visão Global)</option>
                  {worksites.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#0F0F11] text-white">
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="bg-[#151517] border border-[#1F1F21] px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 shrink-0">
            <Package className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-[#666666] block text-[10px] uppercase tracking-wider font-medium">Insumos</span>
              <span className="font-mono font-bold text-white text-xs">{materials.length} itens</span>
            </div>
          </div>

          <div className="bg-[#151517] border border-[#1F1F21] px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 shrink-0">
            <span className="text-emerald-400 font-bold text-xs font-mono">R$</span>
            <div>
              <span className="text-[#666666] block text-[10px] uppercase tracking-wider font-medium">Valor em Estoque</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">
                {totalStockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          {criticalCount > 0 && (
            <button
              onClick={() => setActiveTab('materials')}
              className="bg-amber-950/40 border border-amber-500/30 text-[#F2A30F] px-3 py-1.5 rounded-xl flex items-center gap-2 shrink-0 hover:bg-amber-900/40 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-[#F2A30F] animate-pulse" />
              <div>
                <span className="block text-[10px] uppercase tracking-wider text-[#F2A30F]/80 font-medium">
                  Alerta Crítico
                </span>
                <span className="font-mono font-bold text-xs">{criticalCount} em falta</span>
              </div>
            </button>
          )}

          {/* New Movement CTA Button (Hidden or disabled if user role cannot execute movements) */}
          {canMove && (
            <button
              onClick={onOpenNewMovement}
              className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Lançar</span> Movimentação
            </button>
          )}

          {/* USER PROFILE / AUTH BUTTON */}
          <div className="relative shrink-0" ref={userMenuRef}>
            {currentUser ? (
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="bg-[#151517] hover:bg-[#1F1F21] border border-[#222226] hover:border-[#F2A30F]/50 px-3 py-1.5 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-[#F2A30F]/15 text-[#F2A30F] font-bold border border-[#F2A30F]/30 flex items-center justify-center text-xs">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-[#F2A30F] font-medium leading-tight">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="bg-[#151517] hover:bg-[#1F1F21] border border-[#F2A30F]/40 text-[#F2A30F] px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <UserIcon className="w-4 h-4" />
                <span>Entrar / Cadastrar</span>
              </button>
            )}

            {/* USER DROPDOWN MENU */}
            {isUserMenuOpen && currentUser && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0F0F11] border border-[#222226] rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="p-3 bg-[#151517] border border-[#1F1F21] rounded-xl mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-base shadow-sm border border-emerald-400/40">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-emerald-400 font-semibold">{currentUser.role}</div>
                      <div className="text-[10px] text-[#888888] truncate">{currentUser.email}</div>
                    </div>
                  </div>

                  {currentUser.worksiteAssigned && (
                    <div className="mt-2 pt-2 border-t border-[#222226] flex items-center gap-1.5 text-[11px] text-[#AAAAAA]">
                      <Building className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate">{currentUser.worksiteAssigned}</span>
                    </div>
                  )}
                </div>

                {/* Profile Menu Requested Actions */}
                <div className="space-y-1 text-xs">
                  {/* 1. Meu Perfil */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full p-2.5 rounded-xl text-left hover:bg-[#18181C] text-[#E0E0E0] hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    id="user-menu-item-profile"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">Meu Perfil</span>
                    </div>
                    <span className="text-[10px] text-[#777777] group-hover:text-emerald-400 transition-colors">Detalhes</span>
                  </button>

                  {/* 2. Configurações */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsSettingsModalOpen(true);
                    }}
                    className="w-full p-2.5 rounded-xl text-left hover:bg-[#18181C] text-[#E0E0E0] hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    id="user-menu-item-settings"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                        <Settings className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">Configurações</span>
                    </div>
                    <span className="text-[10px] text-[#777777] group-hover:text-blue-400 transition-colors">Sistema</span>
                  </button>

                  {/* 3. Tema Claro/Escuro */}
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full p-2.5 rounded-xl text-left hover:bg-[#18181C] text-[#E0E0E0] hover:text-white flex items-center justify-between transition-colors cursor-pointer group"
                    id="user-menu-item-theme"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      </div>
                      <span className="font-semibold">Tema Claro / Escuro</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1F1F24] text-amber-400 border border-amber-500/30">
                      {theme === 'dark' ? 'Escuro' : 'Claro'}
                    </span>
                  </button>

                  {canManageUsers(currentUser?.role) && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setActiveTab('users');
                      }}
                      className="w-full p-2.5 rounded-xl text-left hover:bg-[#18181C] text-[#E0E0E0] hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="font-semibold">Gerenciar Usuários</span>
                    </button>
                  )}

                  {/* Divider */}
                  <div className="my-1 border-t border-[#1F1F24]" />

                  {/* 4. Sair */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full p-2.5 rounded-xl text-left hover:bg-red-950/40 text-red-400 hover:text-red-300 flex items-center justify-between transition-colors cursor-pointer group"
                    id="user-menu-item-logout"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="font-bold">Sair</span>
                    </div>
                    <span className="text-[10px] text-red-400/80">Encerrar sessão</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Render User Profile & Settings Modals */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      <UserSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenLogoCustomizer={() => setIsLogoModalOpen(true)}
      />

      {/* Navigation Tabs */}
      <div className="bg-[#0A0A0B] border-t border-[#1F1F21] px-4 sm:px-6 lg:px-8">
        <nav className="max-w-7xl mx-auto flex gap-1 overflow-x-auto no-scrollbar text-sm font-medium">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'border-[#F2A30F] text-[#F2A30F] bg-[#151517]'
                : 'border-transparent text-[#888888] hover:text-white hover:bg-[#151517]/50'
            }`}
          >
            <Home className="w-4 h-4 text-[#F2A30F]" />
            Início (Home)
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'materials'
                ? 'border-[#F2A30F] text-[#F2A30F] bg-[#151517]'
                : 'border-transparent text-[#888888] hover:text-white hover:bg-[#151517]/50'
            }`}
          >
            <Package className="w-4 h-4" />
            Catálogo de Insumos
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'movements'
                ? 'border-[#F2A30F] text-[#F2A30F] bg-[#151517]'
                : 'border-transparent text-[#888888] hover:text-white hover:bg-[#151517]/50'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Movimentações (Entrada/Saída)
          </button>

          <button
            onClick={() => setActiveTab('worksites')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'worksites'
                ? 'border-[#F2A30F] text-[#F2A30F] bg-[#151517]'
                : 'border-transparent text-[#888888] hover:text-white hover:bg-[#151517]/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Canteiros de Obras
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'border-[#F2A30F] text-[#F2A30F] bg-[#151517]'
                : 'border-transparent text-[#888888] hover:text-white hover:bg-[#151517]/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#F2A30F]" />
            Assistente IA & Romaneio
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-[#F2A30F] text-[#F2A30F] bg-[#151517]'
                : 'border-transparent text-[#888888] hover:text-white hover:bg-[#151517]/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Relatórios & Análise
          </button>

          {canManageUsers(currentUser?.role) && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'border-[#F2A30F] text-[#F2A30F] bg-[#151517]'
                  : 'border-transparent text-[#888888] hover:text-white hover:bg-[#151517]/50'
              }`}
            >
              <Users className="w-4 h-4 text-[#F2A30F]" />
              Gerenciar Usuários
            </button>
          )}
        </nav>
      </div>

      {/* LOGO CUSTOMIZATION MODAL */}
      {isLogoModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#0F0F11] border border-[#222226] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsLogoModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#888888] hover:text-white bg-[#151517] hover:bg-[#1F1F21] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#F2A30F]/15 border border-[#F2A30F]/30 text-[#F2A30F] rounded-2xl">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Alterar Foto / Logotipo</h3>
                <p className="text-xs text-[#888888]">
                  Personalize o ícone do canto superior esquerdo para Hogar Empreendimentos.
                </p>
              </div>
            </div>

            {/* Current Preview */}
            <div className="p-4 bg-[#151517] border border-[#1F1F21] rounded-2xl flex items-center gap-4">
              <div className="w-14 h-14 bg-[#F2A30F] rounded-2xl flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {logoData.type === 'image' ? (
                  <img src={logoData.value} alt="Preview Logo" className="w-full h-full object-cover" />
                ) : logoData.value === 'Building2' ? (
                  <Building2 className="w-8 h-8 text-black" />
                ) : logoData.value === 'Package' ? (
                  <Package className="w-8 h-8 text-black" />
                ) : logoData.value === 'ShieldCheck' ? (
                  <ShieldCheck className="w-8 h-8 text-black" />
                ) : logoData.value === 'Factory' ? (
                  <Factory className="w-8 h-8 text-black" />
                ) : logoData.value === 'Wrench' ? (
                  <Wrench className="w-8 h-8 text-black" />
                ) : (
                  <HardHat className="w-8 h-8 text-black" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Visualização Atual</div>
                <div className="text-[11px] text-[#888888]">
                  {logoData.type === 'image' ? 'Imagem / Logotipo Customizado' : `Ícone: ${logoData.value}`}
                </div>
              </div>
            </div>

            {/* Option 1: File Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#F2A30F]">
                1. Carregar Foto do Computador (PNG, JPG, WebP, SVG)
              </label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-[#2B2B2E] hover:border-[#F2A30F] rounded-2xl cursor-pointer bg-[#151517] hover:bg-[#1A1A1E] transition-all p-3 text-center">
                <Upload className="w-6 h-6 text-[#F2A30F] mb-1" />
                <span className="text-xs font-bold text-white">Clique para selecionar imagem</span>
                <span className="text-[10px] text-[#888888] mt-0.5">Tamanho máximo: 3MB</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              {fileError && <p className="text-xs text-red-400 font-medium">{fileError}</p>}
            </div>

            {/* Option 2: Image URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#F2A30F]">
                2. Ou Cole a URL Direta da Foto/Logotipo
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/minha-foto.png"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 bg-[#151517] border border-[#2B2B2E] rounded-xl p-2.5 text-xs text-white placeholder-[#555555] focus:ring-2 focus:ring-[#F2A30F] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (imageUrlInput.trim()) {
                      handleSaveLogo({ type: 'image', value: imageUrlInput.trim() });
                    }
                  }}
                  className="bg-[#F2A30F] text-black font-bold text-xs px-3 py-2 rounded-xl hover:bg-amber-400 cursor-pointer"
                >
                  Aplicar URL
                </button>
              </div>
            </div>

            {/* Option 3: Presets Icons */}
            <div className="space-y-1.5 pt-2 border-t border-[#1F1F21]">
              <label className="block text-xs font-bold text-[#A0A0A0]">
                3. Ou Escolha um Ícone de Construção Pré-definido
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { name: 'HardHat', label: 'Capacete', icon: HardHat },
                  { name: 'Building2', label: 'Prédio', icon: Building2 },
                  { name: 'Factory', label: 'Usina', icon: Factory },
                  { name: 'Package', label: 'Insumo', icon: Package },
                  { name: 'Wrench', label: 'Chave', icon: Wrench },
                  { name: 'ShieldCheck', label: 'Escudo', icon: ShieldCheck },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isSelected = logoData.type === 'icon' && logoData.value === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => handleSaveLogo({ type: 'icon', value: item.name })}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#F2A30F] text-black border-[#F2A30F] font-bold shadow-md'
                          : 'bg-[#151517] text-[#A0A0A0] border border-[#1F1F21] hover:text-white hover:border-[#333333]'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                      <span className="text-[10px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1F1F21]">
              <button
                type="button"
                onClick={() => handleSaveLogo({ type: 'icon', value: 'HardHat' })}
                className="text-xs text-[#888888] hover:text-red-400 transition-colors cursor-pointer"
              >
                Restaurar Capacete Padrão
              </button>
              <button
                type="button"
                onClick={() => setIsLogoModalOpen(false)}
                className="px-4 py-2 bg-[#151517] hover:bg-[#1F1F21] border border-[#222226] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

