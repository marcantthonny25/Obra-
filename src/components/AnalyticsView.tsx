import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  Download,
  Upload,
  Printer,
  AlertTriangle,
  Building,
  CheckCircle,
  FileSpreadsheet,
  Database,
} from 'lucide-react';
import { MaterialItem, StockMovement, WorkSite, User } from '../types';

interface AnalyticsViewProps {
  materials: MaterialItem[];
  movements: StockMovement[];
  worksites: WorkSite[];
  currentUser?: User | null;
  onImportBackupJSON: (data: { materials: MaterialItem[]; movements: StockMovement[]; worksites: WorkSite[] }) => void;
  onSeedDemoData?: () => void;
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#f43f5e'];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  materials,
  movements,
  worksites,
  currentUser,
  onImportBackupJSON,
  onSeedDemoData,
}) => {
  const [printShoppingList, setPrintShoppingList] = useState(false);

  // 1. Data: Stock Value by Category
  const categoryValuesMap: Record<string, number> = {};
  materials.forEach((m) => {
    const val = m.quantity * m.avgUnitPrice;
    categoryValuesMap[m.category] = (categoryValuesMap[m.category] || 0) + val;
  });

  const categoryChartData = Object.keys(categoryValuesMap).map((cat) => ({
    name: cat,
    valor: categoryValuesMap[cat],
  }));

  // 2. Data: Consumption by Work Phase
  const phaseMap: Record<string, number> = {};
  movements
    .filter((m) => m.type === 'SAIDA')
    .forEach((m) => {
      const phase = m.workPhase || 'Geral / Outros';
      phaseMap[phase] = (phaseMap[phase] || 0) + (m.totalPrice || 0);
    });

  const phaseChartData = Object.keys(phaseMap).map((phase) => ({
    name: phase,
    custo: phaseMap[phase],
  }));

  // Critical items for Shopping Order
  const criticalMaterials = materials.filter((m) => m.quantity <= m.minQuantity);

  // Backup Export
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      materials,
      movements,
      worksites,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup-estoque-civil-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.removeChild(downloadAnchor);
  };

  // Backup Import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.materials && json.movements && json.worksites) {
          onImportBackupJSON(json);
          alert('Backup do estoque restaurado com sucesso!');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao carregar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Relatórios, Gráficos e Exportação
          </h2>
          <p className="text-xs text-[#888888] mt-0.5">
            Análise financeira do estoque por categoria, consumo por etapa da obra e cotação de compras.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setPrintShoppingList(!printShoppingList)}
            className="px-3.5 py-2 bg-[#F2A30F] text-black font-bold rounded-xl hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {printShoppingList ? 'Ver Gráficos' : 'Gerar Lista de Cotação de Compras'}
          </button>

          <button
            onClick={handleExportBackup}
            className="px-3.5 py-2 border border-[#1F1F21] bg-[#151517] rounded-xl text-[#E0E0E0] hover:text-white hover:bg-[#1F1F21] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Baixar cópia de segurança em JSON"
          >
            <Download className="w-4 h-4" />
            Backup JSON
          </button>

          <label className="px-3.5 py-2 border border-[#1F1F21] bg-[#151517] rounded-xl text-[#E0E0E0] hover:text-white hover:bg-[#1F1F21] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Restaurar
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          {(currentUser?.role === 'Administrador' || currentUser?.role?.toLowerCase() === 'admin') && onSeedDemoData && (
            <button
              onClick={onSeedDemoData}
              className="px-3.5 py-2 border border-amber-500/30 bg-amber-950/20 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-amber-900/30 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Apenas Administrador: Carga manual dos dados de demonstração iniciais"
            >
              <Database className="w-4 h-4 text-amber-400" />
              Carregar Dados de Exemplo
            </button>
          )}
        </div>
      </div>

      {printShoppingList ? (
        /* SHOPPING LIST / PURCHASE ORDER FOR CRITICAL ITEMS */
        <div className="bg-[#0F0F11] rounded-2xl border border-[#F2A30F]/40 p-6 shadow-md space-y-4 print:p-0">
          <div className="flex items-center justify-between border-b border-[#1F1F21] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#F2A30F]" />
                Ordem de Cotação & Lista de Compras para Reposição
              </h3>
              <p className="text-xs text-[#888888] mt-0.5">
                Relação automática dos insumos com estoque abaixo do limite mínimo recomendado.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#151517] border border-[#1F1F21] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#1F1F21] transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimir Documento
            </button>
          </div>

          {criticalMaterials.length === 0 ? (
            <div className="p-8 text-center text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Todos os insumos estão com saldo acima do estoque mínimo! Nenhuma compra urgente necessária no momento.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#1F1F21]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#151517] text-[#A0A0A0] font-semibold border-b border-[#1F1F21]">
                    <th className="p-3">Código</th>
                    <th className="p-3">Insumo</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-right">Saldo Atual</th>
                    <th className="p-3 text-right">Estoque Mínimo</th>
                    <th className="p-3 text-right">Sugestão de Compra</th>
                    <th className="p-3 text-right">Preço Un. Est. (R$)</th>
                    <th className="p-3 text-right">Orçamento Est. (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F21] text-[#E0E0E0]">
                  {criticalMaterials.map((m) => {
                    const suggestedQty = m.minQuantity * 2 - m.quantity;
                    const estimatedCost = suggestedQty * m.avgUnitPrice;

                    return (
                      <tr key={m.id} className="hover:bg-[#151517]">
                        <td className="p-3 font-mono font-bold text-white">{m.code}</td>
                        <td className="p-3 font-bold text-white">{m.name}</td>
                        <td className="p-3 text-[#888888]">{m.category}</td>
                        <td className="p-3 text-right font-mono font-bold text-[#F2A30F]">
                          {m.quantity} {m.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-[#888888]">
                          {m.minQuantity} {m.unit}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400">
                          +{suggestedQty.toFixed(1)} {m.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-[#888888]">
                          {m.avgUnitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {estimatedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* CHARTS & ANALYTICS DASHBOARD */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Stock Value by Category */}
          <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F21]">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#F2A30F]" />
                Valor em Estoque por Categoria (R$)
              </h3>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    dataKey="valor"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151517', borderColor: '#1F1F21', color: '#FFF' }}
                    formatter={(value: any) =>
                      typeof value === 'number'
                        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : value
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Material Costs by Work Phase */}
          <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F21]">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Consumo de Insumos por Etapa da Obra (R$)
              </h3>
            </div>

            <div className="h-72 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phaseChartData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F1F21" />
                  <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#888888' }} />
                  <YAxis tickFormatter={(val) => `R$${val}`} tick={{ fontSize: 10, fill: '#888888' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151517', borderColor: '#1F1F21', color: '#FFF' }}
                    formatter={(value: any) =>
                      typeof value === 'number'
                        ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : value
                    }
                  />
                  <Bar dataKey="custo" fill="#F2A30F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
