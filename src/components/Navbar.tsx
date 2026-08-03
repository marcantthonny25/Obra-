import React from 'react';
import { Package, ArrowRightLeft, Building2, Sparkles, BarChart3, AlertTriangle, Plus, HardHat } from 'lucide-react';
import { MaterialItem } from '../types';

interface NavbarProps {
  activeTab: 'materials' | 'movements' | 'worksites' | 'ai' | 'analytics';
  setActiveTab: (tab: 'materials' | 'movements' | 'worksites' | 'ai' | 'analytics') => void;
  materials: MaterialItem[];
  onOpenNewMovement: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  materials,
  onOpenNewMovement,
}) => {
  // Calculate critical items count
  const criticalCount = materials.filter((m) => m.quantity <= m.minQuantity).length;
  const totalStockValue = materials.reduce((acc, m) => acc + m.quantity * m.avgUnitPrice, 0);

  return (
    <header className="bg-[#0F0F11] border-b border-[#1F1F21] text-white sticky top-0 z-40 shadow-sm">
      {/* Top Banner Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="bg-[#F2A30F] text-black p-2.5 rounded-xl shadow-md flex items-center justify-center font-bold">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-sans">
                Estoque Civil <span className="text-[#F2A30F] font-mono text-xs uppercase tracking-widest ml-1 opacity-90">Pro</span>
              </h1>
              <span className="bg-[#1F1F21] text-[#F2A30F] border border-[#333333] text-xs font-semibold px-2 py-0.5 rounded-full">
                Obras & Insumos
              </span>
            </div>
            <p className="text-xs text-[#888888]">Gestão de Materiais, Almoxarifado e Canteiros de Obras</p>
          </div>
        </div>

        {/* Stock KPI summary badges */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 md:pb-0 text-xs">
          <div className="bg-[#151517] border border-[#1F1F21] px-3.5 py-1.5 rounded-xl flex items-center gap-2.5 shrink-0">
            <Package className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-[#666666] block text-[10px] uppercase tracking-wider font-medium">Total Insumos</span>
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

          {/* New Movement CTA Button */}
          <button
            onClick={onOpenNewMovement}
            className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Lançar</span> Movimentação
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#0A0A0B] border-t border-[#1F1F21] px-4 sm:px-6 lg:px-8">
        <nav className="max-w-7xl mx-auto flex gap-1 overflow-x-auto no-scrollbar text-sm font-medium">
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
        </nav>
      </div>
    </header>
  );
};
