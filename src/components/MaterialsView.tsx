import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Grid,
  List,
  Calendar,
  Building,
  Package,
  Boxes,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { MaterialCategory, MaterialItem, StockMovement, WorkSite, isGlobalWorksiteRole, canCreateOrEditCatalog, canCreateOrEditMovements, filterMaterialsByWorksite } from '../types';
import type { User } from '../types';

interface MaterialsViewProps {
  materials: MaterialItem[];
  worksites?: WorkSite[];
  movements?: StockMovement[];
  currentUser?: User | null;
  selectedWorksiteId?: string;
  onSelectWorksite?: (id: string) => void;
  onOpenNewMaterial: () => void;
  onEditMaterial: (material: MaterialItem) => void;
  onDeleteMaterial: (id: string) => void;
  onOpenQuickMovement: (materialId: string) => void;
}

const CATEGORIES: ('Todas' | MaterialCategory)[] = [
  'Todas',
  'Cimento e Agregados',
  'Aço e Estrutura',
  'Alvenaria e Blocos',
  'Argamassas e Selantes',
  'Tubos e Conexões',
  'Pintura e Acabamento',
  'Madeiras e Fôrmas',
  'Elétrica',
  'Cobertura',
  'Equipamentos e EPIs',
  'Outros',
];

export const MaterialsView: React.FC<MaterialsViewProps> = ({
  materials,
  worksites = [],
  movements = [],
  currentUser,
  selectedWorksiteId = 'ALL',
  onSelectWorksite,
  onOpenNewMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onOpenQuickMovement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | MaterialCategory>('Todas');
  const [selectedWorksite, setSelectedWorksite] = useState<string>(selectedWorksiteId || 'ALL');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'expiry'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const isGlobalUser = isGlobalWorksiteRole(currentUser?.role);

  // Sync with selectedWorksiteId prop from header
  useEffect(() => {
    if (selectedWorksiteId) {
      setSelectedWorksite(selectedWorksiteId);
    }
  }, [selectedWorksiteId]);

  // First filter materials by selected worksite
  const worksiteFilteredMaterials = filterMaterialsByWorksite(materials, selectedWorksite, worksites, movements);

  // Filter logic for search, category, and status
  const filteredMaterials = worksiteFilteredMaterials.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;

    let matchesFilter = true;
    if (filterType === 'critical') {
      matchesFilter = item.quantity <= item.minQuantity;
    } else if (filterType === 'expiry') {
      matchesFilter = !!item.expiryDate;
    }

    return matchesSearch && matchesCategory && matchesFilter;
  });

  // Temporary log for debugging worksite filtering
  useEffect(() => {
    console.log(
      `[Log Catálogo/MaterialsView] role: ${currentUser?.role || 'Visitante'}, selectedWorksiteId: ${selectedWorksite}, docsCount: ${filteredMaterials.length}`
    );
  }, [currentUser?.role, selectedWorksite, filteredMaterials.length]);

  const totalValue = materials.reduce((acc, m) => acc + m.quantity * m.avgUnitPrice, 0);
  const criticalItems = materials.filter((m) => m.quantity <= m.minQuantity);

  return (
    <div className="space-y-6">
      {/* Global Access Role Banner */}
      {isGlobalUser && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Acesso Global ao Estoque Liberado:</span> Cargo de{' '}
              <span className="text-emerald-400 font-semibold">{currentUser?.role}</span> ({currentUser?.name}) possui visão integrada e controle de insumos de todos os canteiros da Hogar Empreendimentos.
            </div>
          </div>
          <span className="bg-emerald-900/60 border border-emerald-500/40 font-mono text-[10px] font-bold px-2 py-1 rounded-lg shrink-0">
            TODAS AS OBRAS
          </span>
        </div>
      )}

      {/* Top Banner / Actions Header */}
      <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Catálogo de Insumos da Obra
          </h2>
          <p className="text-xs text-[#888888] mt-0.5">
            Gerencie o saldo físico de cimento, agregados, aço, alvenaria e equipamentos do canteiro.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-[#151517] p-1 rounded-xl flex items-center border border-[#1F1F21]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid' ? 'bg-[#1F1F21] text-[#F2A30F] shadow-sm' : 'text-[#888888] hover:text-white'
              }`}
              title="Visualização em Cards"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table' ? 'bg-[#1F1F21] text-[#F2A30F] shadow-sm' : 'text-[#888888] hover:text-white'
              }`}
              title="Visualização em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {canCreateOrEditCatalog(currentUser?.role) ? (
            <button
              onClick={onOpenNewMaterial}
              className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Novo Insumo
            </button>
          ) : (
            <span className="bg-[#151517] border border-[#222226] text-[#888888] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Somente Leitura ({currentUser?.role || 'Consulta'})
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F0F11] p-4 rounded-xl border border-[#1F1F21] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#888888] font-medium">Total de Insumos</span>
            <div className="text-2xl font-mono font-bold text-white mt-1">{materials.length} <span className="text-xs text-[#666666] font-normal font-sans">tipos</span></div>
          </div>
          <div className="p-3 bg-blue-950/30 text-blue-400 border border-blue-500/20 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#0F0F11] p-4 rounded-xl border border-[#1F1F21] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#888888] font-medium">Patrimônio em Estoque</span>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
              {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
          <div className="p-3 bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 rounded-xl font-bold font-mono text-lg">
            R$
          </div>
        </div>

        <button
          onClick={() => setFilterType(filterType === 'critical' ? 'all' : 'critical')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            criticalItems.length > 0
              ? 'bg-amber-950/30 border-amber-500/40 hover:bg-amber-900/40'
              : 'bg-[#0F0F11] border-[#1F1F21]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-[#F2A30F]">Estoque Crítico</span>
              <div className="text-2xl font-mono font-bold text-[#F2A30F] mt-1">
                {criticalItems.length} <span className="text-xs font-normal font-sans">itens</span>
              </div>
            </div>
            <div className="p-3 bg-amber-500/20 text-[#F2A30F] rounded-xl border border-amber-500/30">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <span className="text-[11px] text-[#A0A0A0] mt-2 block font-medium">
            {filterType === 'critical' ? '✓ Filtrando itens críticos' : 'Clique para ver itens que exigem compra'}
          </span>
        </button>

        <div className="bg-[#0F0F11] p-4 rounded-xl border border-[#1F1F21] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-[#888888] font-medium">Com Validade</span>
            <div className="text-2xl font-mono font-bold text-white mt-1">
              {materials.filter((m) => m.expiryDate).length} <span className="text-xs text-[#666666] font-normal font-sans">lotes</span>
            </div>
          </div>
          <div className="p-3 bg-purple-950/30 text-purple-400 border border-purple-500/20 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-[#0F0F11] rounded-xl border border-[#1F1F21] p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Bar & Canteiro Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#666666] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por nome, código, local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-[#666666] focus:border-[#F2A30F] outline-none transition-all"
              />
            </div>

            {/* Canteiro Selector */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Building2 className="w-4 h-4 text-[#F2A30F] absolute left-3 top-2.5" />
              <select
                value={selectedWorksite}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedWorksite(val);
                  if (onSelectWorksite) onSelectWorksite(val);
                }}
                className="w-full bg-[#151517] border border-[#1F1F21] text-[#A0A0A0] focus:text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:border-[#F2A30F] outline-none cursor-pointer"
              >
                <option value="ALL">🏢 Todos os Canteiros (Visão Global)</option>
                {worksites.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name} ({ws.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#F2A30F] text-black font-bold'
                  : 'bg-[#151517] text-[#888888] hover:text-white border border-[#1F1F21]'
              }`}
            >
              Todos ({materials.length})
            </button>
            <button
              onClick={() => setFilterType('critical')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                filterType === 'critical'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-amber-950/40 text-[#F2A30F] border border-amber-500/30 hover:bg-amber-900/40'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Abaixo do Mínimo ({criticalItems.length})
            </button>
            <button
              onClick={() => setFilterType('expiry')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                filterType === 'expiry'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-purple-950/40 text-purple-400 border border-purple-500/30 hover:bg-purple-900/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Com Validade
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-[#1F1F21] text-xs">
          <span className="text-[#666666] font-medium shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Categorias:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#F2A30F] text-black font-bold shadow-sm'
                  : 'bg-[#151517] text-[#888888] border border-[#1F1F21] hover:text-white hover:border-[#333333]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials Listing */}
      {filteredMaterials.length === 0 ? (
        <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-12 text-center text-[#888888] space-y-3">
          <Package className="w-12 h-12 text-[#444444] mx-auto" />
          <h3 className="text-base font-bold text-white">Nenhum insumo encontrado</h3>
          <p className="text-xs text-[#666666] max-w-md mx-auto">
            Não foi encontrado nenhum material com os filtros selecionados. Tente ajustar os termos de busca ou cadastrar um novo insumo.
          </p>
          <button
            onClick={onOpenNewMaterial}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-[#F2A30F] text-black font-bold rounded-xl text-xs hover:bg-amber-400 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Cadastrar Insumo
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((item) => {
            const isCritical = item.quantity <= item.minQuantity;
            const itemValue = item.quantity * item.avgUnitPrice;
            const stockPct = item.minQuantity > 0 ? Math.min(100, (item.quantity / (item.minQuantity * 2)) * 100) : 100;

            return (
              <div
                key={item.id}
                className={`bg-[#0F0F11] rounded-2xl border p-5 shadow-sm transition-all hover:border-[#333333] hover:bg-[#121215] flex flex-col justify-between relative overflow-hidden ${
                  isCritical ? 'border-amber-500/50 bg-amber-950/10' : 'border-[#1F1F21]'
                }`}
              >
                {/* Top Critical Ribbon if applicable */}
                {isCritical && (
                  <div className="bg-[#F2A30F] text-black text-[10px] font-extrabold px-3 py-0.5 rounded-bl-lg absolute top-0 right-0 flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3 h-3" /> REPOSIÇÃO NECESSÁRIA
                  </div>
                )}

                <div>
                  {/* Category & SKU */}
                  <div className="flex items-center justify-between text-xs text-[#888888] mb-2 pt-1">
                    <span className="font-mono bg-[#151517] text-[#A0A0A0] border border-[#1F1F21] px-2 py-0.5 rounded font-semibold text-[11px]">
                      {item.code}
                    </span>
                    <span className="bg-[#151517] text-[#888888] border border-[#1F1F21] px-2 py-0.5 rounded-full text-[11px] font-medium">
                      {item.category}
                    </span>
                  </div>

                  {/* Material Name */}
                  <h3 className="font-bold text-white text-base leading-snug line-clamp-2">
                    {item.name}
                  </h3>

                  {/* Location & Supplier */}
                  <div className="mt-2 space-y-1 text-xs text-[#888888]">
                    <div className="flex items-center gap-1.5 text-[#888888]">
                      <Building className="w-3.5 h-3.5 text-[#666666] shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    {item.supplier && (
                      <div className="text-[11px] text-[#666666] truncate">
                        Fornecedor: <span className="text-[#A0A0A0] font-medium">{item.supplier}</span>
                      </div>
                    )}
                    {(item.details || (item.detailsOptions && item.detailsOptions.length > 0)) && (
                      <div className="mt-2 flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-[#888888]">Detalhes/Cores:</span>
                        {item.detailsOptions ? (
                          item.detailsOptions.map((opt) => (
                            <span key={opt} className="bg-[#151517] text-[#F2A30F] border border-[#2B2B2E] text-[10px] px-1.5 py-0.5 rounded font-mono">
                              {opt}
                            </span>
                          ))
                        ) : (
                          <span className="bg-[#151517] text-[#F2A30F] border border-[#2B2B2E] text-[10px] px-1.5 py-0.5 rounded font-mono">
                            {item.details}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stock Quantity & Visual Gauge */}
                  <div className="mt-4 p-3 bg-[#151517] border border-[#1F1F21] rounded-xl space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[#888888] font-medium">Saldo Atual:</span>
                      <span className={`text-xl font-mono font-bold ${isCritical ? 'text-[#F2A30F]' : 'text-white'}`}>
                        {item.quantity}{' '}
                        <span className="text-xs font-sans font-normal text-[#888888]">{item.unit}</span>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#252529] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCritical ? 'bg-[#F2A30F]' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, stockPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#888888]">
                      <span>Mínimo: {item.minQuantity} {item.unit}</span>
                      <span>
                        Val. Total: <strong className="text-white font-mono">{itemValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Batch / Expiry info */}
                  {(item.expiryDate || item.batchNumber) && (
                    <div className="mt-2 flex items-center justify-between text-[11px] bg-purple-950/30 text-purple-300 p-2 rounded-lg border border-purple-500/20">
                      {item.expiryDate && (
                        <span>Validade: <strong className="text-purple-200">{item.expiryDate}</strong></span>
                      )}
                      {item.batchNumber && <span>Lote: {item.batchNumber}</span>}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-[#1F1F21] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {canCreateOrEditMovements(currentUser?.role) ? (
                      <button
                        onClick={() => onOpenQuickMovement(item.id)}
                        className="px-3 py-1.5 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                        title="Lançar movimentação neste insumo"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                        Movimentar
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#777777] italic font-mono">Somente Leitura</span>
                    )}
                  </div>

                  {canCreateOrEditCatalog(currentUser?.role) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditMaterial(item)}
                        className="p-1.5 text-[#888888] hover:text-white hover:bg-[#1F1F21] rounded-lg transition-colors cursor-pointer"
                        title="Editar Insumo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMaterial(item.id)}
                        className="p-1.5 text-[#888888] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Insumo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#151517] text-[#A0A0A0] border-b border-[#1F1F21] font-semibold uppercase text-[11px] tracking-wider">
                  <th className="p-3.5">Código</th>
                  <th className="p-3.5">Descrição do Insumo</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Localização</th>
                  <th className="p-3.5 text-right">Saldo Atual</th>
                  <th className="p-3.5 text-right">Mínimo</th>
                  <th className="p-3.5 text-right">Preço Un.</th>
                  <th className="p-3.5 text-right">Valor Total</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F21] text-[#E0E0E0]">
                {filteredMaterials.map((item) => {
                  const isCritical = item.quantity <= item.minQuantity;
                  const itemValue = item.quantity * item.avgUnitPrice;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#151517] transition-colors ${
                        isCritical ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-semibold text-[#A0A0A0]">{item.code}</td>
                      <td className="p-3 font-semibold text-white">
                        {item.name}
                        {isCritical && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] bg-[#F2A30F] text-black font-extrabold px-1.5 py-0.2 rounded">
                            <AlertTriangle className="w-3 h-3" /> CRÍTICO
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-[#888888]">{item.category}</td>
                      <td className="p-3 text-[#888888]">{item.location}</td>
                      <td className="p-3 text-right font-mono font-bold text-sm text-white">
                        <span className={isCritical ? 'text-[#F2A30F]' : ''}>
                          {item.quantity} {item.unit}
                        </span>
                      </td>
                      <td className="p-3 text-right text-[#888888]">
                        {item.minQuantity} {item.unit}
                      </td>
                      <td className="p-3 text-right text-[#A0A0A0] font-mono">
                        {item.avgUnitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-400 font-mono">
                        {itemValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {canCreateOrEditMovements(currentUser?.role) && (
                            <button
                              onClick={() => onOpenQuickMovement(item.id)}
                              className="p-1.5 bg-[#F2A30F] text-black rounded-lg hover:bg-amber-400 font-bold transition-all cursor-pointer"
                              title="Lançar Movimentação"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          )}
                          {canCreateOrEditCatalog(currentUser?.role) && (
                            <>
                              <button
                                onClick={() => onEditMaterial(item)}
                                className="p-1.5 text-[#888888] hover:text-white hover:bg-[#1F1F21] rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteMaterial(item.id)}
                                className="p-1.5 text-[#888888] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {!canCreateOrEditMovements(currentUser?.role) && !canCreateOrEditCatalog(currentUser?.role) && (
                            <span className="text-[10px] text-[#666666] font-mono">Consulta</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
