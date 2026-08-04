import React from 'react';
import { Package, ArrowRight, Building2, ShieldCheck, Sparkles, LogIn } from 'lucide-react';
import type { User } from '../types';

interface HomePageProps {
  onNavigate: (tab: 'materials' | 'movements' | 'worksites' | 'ai' | 'analytics' | 'users') => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  currentUser,
  onOpenAuthModal,
}) => {
  return (
    <div 
      className="relative w-full min-h-screen flex flex-col items-center justify-end bg-[#0B0B0C] overflow-hidden select-none"
      style={{
        backgroundImage: 'url(/hogar_home_hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        width: '100vw',
      }}
    >
      {/* Semi-transparent dark overlay to ensure maximum legibility for text content and buttons */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[0.5px]" />

      {/* Main Interactive Floating Action Card */}
      <div className="relative z-10 max-w-5xl w-full mx-auto px-4 sm:px-6 pb-12 pt-8 flex flex-col items-center justify-end text-center">
        {/* Floating System Action Bar at bottom center of screen */}
        <div className="w-full max-w-3xl bg-[#0F0F11]/90 backdrop-blur-md border border-emerald-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#222226] pb-4">
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Sistema Hogar - Online & Sincronizado
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Gestão Integrada de Almoxarifados e Obras
              </h2>
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 bg-[#151517] border border-[#222226] px-3.5 py-1.5 rounded-2xl">
                <ShieldCheck className="w-4 h-4 text-[#F2A30F]" />
                <div className="text-left text-xs">
                  <span className="text-[#888888] text-[10px] block">Conectado como:</span>
                  <span className="font-bold text-white">{currentUser.name}</span>
                  <span className="text-emerald-400 font-semibold ml-1 text-[11px]">({currentUser.role})</span>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <LogIn className="w-4 h-4" />
                Acessar Minha Conta
              </button>
            )}
          </div>

          {/* Quick Nav Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('materials')}
              className="group bg-[#151517]/80 hover:bg-[#1F1F21] border border-[#222226] hover:border-[#F2A30F]/60 p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[#F2A30F] mb-1">
                <Package className="w-5 h-5" />
                <ArrowRight className="w-3.5 h-3.5 text-[#888888] group-hover:text-[#F2A30F] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">Catálogo Insumos</span>
                <span className="text-[10px] text-[#888888]">Estoque e saldos</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('worksites')}
              className="group bg-[#151517]/80 hover:bg-[#1F1F21] border border-[#222226] hover:border-[#F2A30F]/60 p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-blue-400 mb-1">
                <Building2 className="w-5 h-5" />
                <ArrowRight className="w-3.5 h-3.5 text-[#888888] group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">Canteiros de Obra</span>
                <span className="text-[10px] text-[#888888]">Gestão por canteiro</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('movements')}
              className="group bg-[#151517]/80 hover:bg-[#1F1F21] border border-[#222226] hover:border-[#F2A30F]/60 p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-emerald-400 mb-1">
                <Package className="w-5 h-5" />
                <ArrowRight className="w-3.5 h-3.5 text-[#888888] group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">Movimentações</span>
                <span className="text-[10px] text-[#888888]">Entradas e saídas</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('ai')}
              className="group bg-[#151517]/80 hover:bg-[#1F1F21] border border-[#222226] hover:border-[#F2A30F]/60 p-3 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[#F2A30F] mb-1">
                <Sparkles className="w-5 h-5" />
                <ArrowRight className="w-3.5 h-3.5 text-[#888888] group-hover:text-[#F2A30F] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">IA Romaneio</span>
                <span className="text-[10px] text-[#888888]">Leitura inteligente</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
