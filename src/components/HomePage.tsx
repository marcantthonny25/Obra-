import React from 'react';
import {
  Package,
  ArrowRight,
  Building2,
  ShieldCheck,
  Sparkles,
  LogIn,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Bell,
  BarChart3,
  PlusCircle,
  HardHat,
  Boxes,
} from 'lucide-react';
import type { User, MaterialItem, StockMovement, WorkSite } from '../types';

interface HomePageProps {
  onNavigate: (tab: 'materials' | 'movements' | 'worksites' | 'ai' | 'analytics' | 'users') => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
  materials?: MaterialItem[];
  movements?: StockMovement[];
  worksites?: WorkSite[];
  onOpenQuickMovement?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  currentUser,
  onOpenAuthModal,
  materials = [],
  movements = [],
  worksites = [],
  onOpenQuickMovement,
}) => {
  // Compute key indicators safely
  const totalMaterials = materials.length;
  const criticalStockCount = materials.filter((m) => m.quantity <= m.minQuantity).length;
  const activeWorksitesCount = worksites.filter((w) => w.status === 'Em Andamento' || !w.status).length;
  const totalMovementsCount = movements.length;

  const recentMovements = movements.slice(0, 4);

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-[#0B0B0C] text-[#E0E0E0] select-none py-6 px-4 sm:px-6 lg:px-8 space-y-8 max-w-[1500px] mx-auto">
      
      {/* 1. Header Hero Welcome Banner */}
      <section id="dashboard-hero-header" className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F1D16] via-[#0F0F11] to-[#0A120D] border border-emerald-500/20 p-6 sm:p-8 shadow-2xl">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hogar Empreendimentos • Painel de Controle Integrado</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {currentUser ? (
                <>
                  Bem-vindo(a) de volta, <span className="text-emerald-400">{currentUser.name}</span>!
                </>
              ) : (
                <>
                  Plataforma Inteligente de <span className="text-emerald-400">Gestão de Obras & Estoque</span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-[#9E9E9E] leading-relaxed">
              Monitore materiais em tempo real, controle saídas para canteiros de obras e mantenha a rastreabilidade total do almoxarifado corporativo.
            </p>
          </div>

          {/* User Status / Quick Switch action */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-[#141417]/90 backdrop-blur border border-[#26262A] p-2.5 rounded-2xl shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs pr-1">
                  <span className="text-[#888888] text-[10px] block font-medium">Sessão Ativa</span>
                  <span className="font-bold text-white block max-w-[140px] truncate">{currentUser.name}</span>
                  <span className="text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">{currentUser.role}</span>
                </div>
                <button
                  onClick={onOpenAuthModal}
                  className="bg-[#1F1F24] hover:bg-emerald-600 hover:text-white text-emerald-400 border border-emerald-500/30 font-semibold p-2.5 rounded-xl text-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm ml-1"
                  title="Trocar de usuário ou alterar conta"
                  id="btn-trocar-usuario-dashboard"
                >
                  <RefreshCw className="w-4 h-4 stroke-[2]" />
                  <span className="hidden sm:inline">Trocar Conta</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-95 cursor-pointer"
                id="btn-login-dashboard"
              >
                <LogIn className="w-4 h-4" />
                <span>Acessar Minha Conta / Login</span>
              </button>
            )}

            {onOpenQuickMovement && (
              <button
                onClick={onOpenQuickMovement}
                className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all active:scale-95 cursor-pointer"
                id="btn-quick-movement-dashboard"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Lançar Movimentação</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Top Summary KPI Cards (Fast indicators) */}
      <section id="dashboard-kpi-summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-[#222226] hover:border-emerald-500/30 p-5 rounded-2xl transition-all shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#888888] block">Insumos Cadastrados</span>
            <div className="text-2xl font-black text-white mt-1">{totalMaterials}</div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <Boxes className="w-3 h-3" /> Catálogo Atualizado
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111113] border border-[#222226] hover:border-amber-500/30 p-5 rounded-2xl transition-all shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#888888] block">Estoque Crítico / Mínimo</span>
            <div className="text-2xl font-black text-white mt-1">{criticalStockCount}</div>
            <span className={`text-[11px] font-medium flex items-center gap-1 mt-1 ${criticalStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              <AlertTriangle className="w-3 h-3" /> {criticalStockCount > 0 ? 'Requer Atenção' : 'Estoque regular'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111113] border border-[#222226] hover:border-blue-500/30 p-5 rounded-2xl transition-all shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#888888] block">Canteiros Ativos</span>
            <div className="text-2xl font-black text-white mt-1">{activeWorksitesCount}</div>
            <span className="text-[11px] text-blue-400 font-medium flex items-center gap-1 mt-1">
              <Building2 className="w-3 h-3" /> Obras sob gestão
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#111113] border border-[#222226] hover:border-emerald-500/30 p-5 rounded-2xl transition-all shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-[#888888] block">Movimentações Registradas</span>
            <div className="text-2xl font-black text-white mt-1">{totalMovementsCount}</div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Entradas & Saídas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* 3. Reorganized Navigation Action Cards (Main System Modules) */}
      <section id="dashboard-main-navigation" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Módulos Principais do Sistema</span>
          </h2>
          <span className="text-xs text-[#888888]">Acesso rápido às rotas de gestão</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Insumos */}
          <button
            onClick={() => onNavigate('materials')}
            className="group bg-[#111113] hover:bg-[#17171A] border border-[#222226] hover:border-emerald-500/60 p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg relative overflow-hidden"
            id="nav-card-materials"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Package className="w-5 h-5" />
              </div>
              <div className="w-7 h-7 rounded-full bg-[#1C1C20] flex items-center justify-center text-[#888888] group-hover:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base text-white block group-hover:text-emerald-400 transition-colors">
                Catálogo de Insumos
              </span>
              <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                Consulte saldos, valores médios, lotes e localização de materiais em estoque.
              </p>
            </div>
          </button>

          {/* Card 2: Canteiros de Obra */}
          <button
            onClick={() => onNavigate('worksites')}
            className="group bg-[#111113] hover:bg-[#17171A] border border-[#222226] hover:border-emerald-500/60 p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg relative overflow-hidden"
            id="nav-card-worksites"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="w-7 h-7 rounded-full bg-[#1C1C20] flex items-center justify-center text-[#888888] group-hover:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base text-white block group-hover:text-emerald-400 transition-colors">
                Canteiros de Obra
              </span>
              <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                Acompanhe o consumo e alocação por obra, etapa de construção e responsável.
              </p>
            </div>
          </button>

          {/* Card 3: Movimentações */}
          <button
            onClick={() => onNavigate('movements')}
            className="group bg-[#111113] hover:bg-[#17171A] border border-[#222226] hover:border-emerald-500/60 p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg relative overflow-hidden"
            id="nav-card-movements"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <div className="w-7 h-7 rounded-full bg-[#1C1C20] flex items-center justify-center text-[#888888] group-hover:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base text-white block group-hover:text-emerald-400 transition-colors">
                Histórico de Movimentos
              </span>
              <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                Registre e audite entradas de notas, saídas para campo e devoluções.
              </p>
            </div>
          </button>

          {/* Card 4: IA Romaneio */}
          <button
            onClick={() => onNavigate('ai')}
            className="group bg-[#111113] hover:bg-[#17171A] border border-[#222226] hover:border-emerald-500/60 p-5 rounded-2xl text-left transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg relative overflow-hidden"
            id="nav-card-ai"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="w-7 h-7 rounded-full bg-[#1C1C20] flex items-center justify-center text-[#888888] group-hover:text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base text-white block group-hover:text-emerald-400 transition-colors">
                IA Romaneio & NFs
              </span>
              <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                Leitura inteligente automatizada de notas fiscais e romaneios de entrega.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 4. Lower Indicators & Activity Preview Section (Prepared space for indicators, alerts & movements) */}
      <section id="dashboard-lower-indicators" className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Left Column (2 cols wide on LG): Recent Activity Timeline & Indicators */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Movements Feed */}
          <div className="bg-[#111113] border border-[#222226] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Últimas Movimentações no Sistema</span>
              </h3>
              <button
                onClick={() => onNavigate('movements')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Ver todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentMovements.length > 0 ? (
              <div className="space-y-3">
                {recentMovements.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#161619] border border-[#222226] hover:border-emerald-500/30 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        mov.type === 'ENTRADA' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                        mov.type === 'SAIDA' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}>
                        {mov.type === 'ENTRADA' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{mov.materialName}</span>
                        <span className="text-[11px] text-[#888888]">
                          {mov.workSiteName || 'Almoxarifado Central'} • {mov.responsible || 'Sistema'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-bold block ${
                        mov.type === 'ENTRADA' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {mov.type === 'ENTRADA' ? '+' : '-'}{mov.quantity} {mov.unit}
                      </span>
                      <span className="text-[10px] text-[#777777]">{mov.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-[#777777]">
                Nenhuma movimentação registrada recentemente.
              </div>
            )}
          </div>

          {/* Lower Indicator Placeholder 1: Operational Flow & Health */}
          <div className="bg-[#111113] border border-[#222226] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Painel de Eficiência da Cadeia de Insumos</span>
              </h3>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                Monitoramento Operacional
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-[#161619] border border-[#222226]">
                <span className="text-[11px] text-[#888888] block">Disponibilidade Almoxarifado</span>
                <div className="text-lg font-bold text-emerald-400 mt-1">98.4%</div>
                <div className="w-full bg-[#222228] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[98.4%]" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161619] border border-[#222226]">
                <span className="text-[11px] text-[#888888] block">Atendimento aos Canteiros</span>
                <div className="text-lg font-bold text-blue-400 mt-1">100%</div>
                <div className="w-full bg-[#222228] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full w-[100%]" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161619] border border-[#222226]">
                <span className="text-[11px] text-[#888888] block">Perda / Avaria Registrada</span>
                <div className="text-lg font-bold text-amber-400 mt-1">0.2%</div>
                <div className="w-full bg-[#222228] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full w-[2%]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 col wide on LG): Notifications & Alert Center Placeholder */}
        <div className="space-y-6">
          {/* Stock Alert Widget */}
          <div className="bg-[#111113] border border-[#222226] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>Alertas & Notificações</span>
              </h3>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {criticalStockCount} Críticos
              </span>
            </div>

            {criticalStockCount > 0 ? (
              <div className="space-y-2.5">
                {materials
                  .filter((m) => m.quantity <= m.minQuantity)
                  .slice(0, 3)
                  .map((m) => (
                    <div
                      key={m.id}
                      onClick={() => onNavigate('materials')}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{m.name}</span>
                        <span className="text-[10px] text-amber-400/90">
                          Atual: {m.quantity} {m.unit} (Mín: {m.minQuantity})
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Todos os insumos estão com saldos acima do estoque mínimo.</span>
              </div>
            )}
          </div>

          {/* Institutional Note & System Identity */}
          <div className="bg-gradient-to-b from-[#111113] to-[#0D1611] border border-emerald-500/20 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <HardHat className="w-4 h-4" />
              <span>Hogar Empreendimentos</span>
            </div>
            <p className="text-xs text-[#9E9E9E] leading-relaxed">
              Padrão corporativo de controle de insumos e logística de canteiros. Conectado ao Firebase Firestore para sincronização em tempo real.
            </p>
            <div className="pt-2 border-t border-[#1F1F24] flex items-center justify-between text-[11px] text-[#777777]">
              <span>Versão 2.4.0</span>
              <span className="text-emerald-400 font-medium">Servidor Ativo</span>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
};

