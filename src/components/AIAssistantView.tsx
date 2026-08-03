import React, { useState } from 'react';
import {
  Sparkles,
  Calculator,
  FileText,
  AlertOctagon,
  Upload,
  CheckCircle2,
  PlusCircle,
  Loader2,
  HardHat,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import { MaterialItem, AIEstimateResult, ParsedInvoiceResult, StockAlertAI, WorkSite } from '../types';

interface AIAssistantViewProps {
  materials: MaterialItem[];
  worksites: WorkSite[];
  onBatchAddMaterials: (items: Omit<MaterialItem, 'id' | 'lastUpdated'>[]) => void;
  onBatchStockIn: (items: { name: string; quantity: number; unitPrice?: number; category: any; unit: string }[]) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  materials,
  worksites,
  onBatchAddMaterials,
  onBatchStockIn,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'estimator' | 'invoice' | 'audit'>('estimator');

  // Estimator state
  const [taskType, setTaskType] = useState('Concretagem de Laje / Vigas');
  const [dimensions, setDimensions] = useState('100m² com espessura de 10cm (10m³ de concreto)');
  const [specs, setSpecs] = useState('Concreto FCK 25MPa, traço 1:2:3 com brita 1 e areia média');
  const [notes, setNotes] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [estimateResult, setEstimateResult] = useState<AIEstimateResult | null>(null);

  // Invoice Reader state
  const [invoiceText, setInvoiceText] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [parsingInvoice, setParsingInvoice] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<ParsedInvoiceResult | null>(null);

  // Audit state
  const [analyzingStock, setAnalyzingStock] = useState(false);
  const [auditResult, setAuditResult] = useState<StockAlertAI | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // 1. Handle Estimator Call
  const handleRunEstimator = async () => {
    if (!dimensions.trim()) return;
    setEstimating(true);
    setEstimateResult(null);

    try {
      const res = await fetch('/api/ai/estimate-mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskType, dimensions, specs, notes }),
      });
      const json = await res.json();
      if (json.success) {
        setEstimateResult(json.data);
      } else {
        alert(`Erro na estimativa: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Falha ao conectar com o servidor: ${err.message}`);
    } finally {
      setEstimating(false);
    }
  };

  // 2. Handle Invoice Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setInvoiceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleParseInvoice = async () => {
    if (!invoiceText.trim() && !invoiceImage) {
      alert('Insira o texto da Nota Fiscal ou faça upload de uma imagem do comprovante.');
      return;
    }
    setParsingInvoice(true);
    setInvoiceResult(null);

    try {
      const res = await fetch('/api/ai/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: invoiceText, imageBase64: invoiceImage }),
      });
      const json = await res.json();
      if (json.success) {
        setInvoiceResult(json.data);
      } else {
        alert(`Erro na leitura do comprovante: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Falha ao conectar com o servidor: ${err.message}`);
    } finally {
      setParsingInvoice(false);
    }
  };

  // 3. Handle Stock Audit
  const handleAnalyzeStock = async () => {
    setAnalyzingStock(true);
    setAuditResult(null);

    try {
      const res = await fetch('/api/ai/analyze-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: materials, activeWorks: worksites }),
      });
      const json = await res.json();
      if (json.success) {
        setAuditResult(json.data);
      } else {
        alert(`Erro na análise: ${json.error}`);
      }
    } catch (err: any) {
      alert(`Falha ao conectar com o servidor: ${err.message}`);
    } finally {
      setAnalyzingStock(false);
    }
  };

  // Batch actions
  const handleAddEstimatedToCatalog = () => {
    if (!estimateResult) return;
    const itemsToAdd = estimateResult.items.map((item, idx) => ({
      code: `INS-${Math.floor(200 + Math.random() * 700)}`,
      name: item.name,
      category: item.category || 'Cimento e Agregados',
      quantity: item.quantity,
      minQuantity: Math.ceil(item.quantity * 0.2),
      unit: item.unit || 'Unidade',
      avgUnitPrice: item.estimatedUnitPrice || 0,
      location: 'Almoxarifado Principal',
      supplier: 'Fornecedor Estimado IA',
      notes: item.notes,
    }));

    onBatchAddMaterials(itemsToAdd);
    showNotification('Insumos calculados foram adicionados com sucesso ao seu Catálogo!');
  };

  const handleImportInvoiceToStock = () => {
    if (!invoiceResult) return;
    onBatchStockIn(invoiceResult.items);
    showNotification('Todas as entradas da Nota Fiscal foram processadas e integradas ao estoque!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0F0F11] via-[#151517] to-[#1a1815] text-white rounded-2xl p-6 shadow-md border border-[#1F1F21]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-amber-500/10 text-[#F2A30F] rounded-xl border border-amber-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-sans text-white">Assistente de Engenharia e IA</h2>
            <p className="text-xs text-[#888888]">
              Cálculo automatizado de insumos por traço de obra, leitura inteligente de Notas Fiscais e análise preditiva.
            </p>
          </div>
        </div>

        {/* Sub-tab Selectors */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#1F1F21] text-xs">
          <button
            onClick={() => setActiveSubTab('estimator')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'estimator'
                ? 'bg-[#F2A30F] text-black shadow-sm'
                : 'bg-[#151517] border border-[#1F1F21] text-[#A0A0A0] hover:bg-[#1F1F21] hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            1. Calculadora de Traço / Consumo
          </button>

          <button
            onClick={() => setActiveSubTab('invoice')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'invoice'
                ? 'bg-[#F2A30F] text-black shadow-sm'
                : 'bg-[#151517] border border-[#1F1F21] text-[#A0A0A0] hover:bg-[#1F1F21] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            2. Leitor de Nota Fiscal (Romaneio)
          </button>

          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-[#F2A30F] text-black shadow-sm'
                : 'bg-[#151517] border border-[#1F1F21] text-[#A0A0A0] hover:bg-[#1F1F21] hover:text-white'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            3. Auditoria de Riscos e Perdas
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-4 bg-emerald-500 text-black font-bold rounded-xl border border-emerald-400 shadow-md flex items-center gap-2 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* SUB-TAB 1: CALCULATOR / ESTIMATOR */}
      {activeSubTab === 'estimator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-6 shadow-sm space-y-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1F1F21]">
              <Calculator className="w-5 h-5 text-[#F2A30F]" />
              <h3 className="font-bold text-white text-base">Especificar Serviço de Obra</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Tipo de Serviço / Etapa</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2.5 font-medium text-white focus:border-[#F2A30F] outline-none"
              >
                <option value="Concretagem de Laje / Vigas / Pilares">Concretagem de Laje / Vigas / Pilares</option>
                <option value="Alvenaria de Vedação (Tijolos Cerâmicos)">Alvenaria de Vedação (Tijolos Cerâmicos)</option>
                <option value="Alvenaria Estrutural (Blocos de Concreto)">Alvenaria Estrutural (Blocos de Concreto)</option>
                <option value="Contrapiso e Regularização">Contrapiso e Regularização</option>
                <option value="Chapisco e Emboço (Revestimento de Argamassa)">Chapisco e Emboço (Revestimento)</option>
                <option value="Cobertura / Telhado e Manta">Cobertura / Telhado e Manta</option>
                <option value="Pintura Interna e Externa">Pintura Interna e Externa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Dimensões / Área ou Volume *</label>
              <input
                type="text"
                placeholder="ex: 120m² com 10cm de espessura (12m³)"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                required
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2.5 text-white placeholder-[#666666] focus:border-[#F2A30F] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Especificações Técnicas / Traço</label>
              <textarea
                rows={2}
                placeholder="ex: Traço 1:2:3 de concreto FCK 25MPa com brita 1 e areia média, ou junta de 1cm para tijolo"
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2.5 text-white placeholder-[#666666] focus:border-[#F2A30F] outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">Observações Gerais</label>
              <input
                type="text"
                placeholder="ex: Considerar perdas de transporte em bomba de concreto"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2.5 text-white placeholder-[#666666] focus:border-[#F2A30F] outline-none text-xs"
              />
            </div>

            <button
              onClick={handleRunEstimator}
              disabled={estimating}
              className="w-full py-3 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold rounded-xl text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {estimating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calculando Traço e Insumos via IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Calcular Lista de Insumos com IA
                </>
              )}
            </button>
          </div>

          {/* Result Panel */}
          <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1F21]">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-[#F2A30F]" />
                  Resultado do Cálculo de Insumos
                </h3>
                {estimateResult && (
                  <span className="bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    Margem de Perda: {estimateResult.safetyLossMarginPct}%
                  </span>
                )}
              </div>

              {!estimateResult ? (
                <div className="py-12 text-center text-[#666666] space-y-2">
                  <Calculator className="w-12 h-12 text-[#333333] mx-auto" />
                  <p className="text-xs">
                    Preencha as dimensões do serviço ao lado e clique em <strong>"Calcular"</strong> para obter a quantificação técnica de cimento, agregados, aço ou tijolos.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4 text-xs">
                  <div className="p-3 bg-[#151517] border border-[#1F1F21] rounded-xl text-[#E0E0E0]">
                    <p className="font-medium">{estimateResult.summary}</p>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {estimateResult.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#151517] border border-[#1F1F21] rounded-xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <h4 className="font-bold text-white">{item.name}</h4>
                          <span className="text-[11px] text-[#888888]">{item.category}</span>
                          {item.notes && (
                            <p className="text-[10px] text-[#F2A30F] mt-0.5 font-medium">{item.notes}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-mono font-bold text-white">
                            {item.quantity} {item.unit}
                          </span>
                          <span className="block text-[11px] font-mono text-[#888888]">
                            ~R$ {item.estimatedUnitPrice.toFixed(2)} / {item.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {estimateResult && (
              <div className="pt-3 border-t border-[#1F1F21]">
                <button
                  onClick={handleAddEstimatedToCatalog}
                  className="w-full py-2.5 bg-[#151517] border border-[#1F1F21] hover:bg-[#1F1F21] text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-[#F2A30F]" />
                  Adicionar Todos os Insumos ao Estoque
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INVOICE / ROMANEIO PARSER */}
      {activeSubTab === 'invoice' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invoice Input Form */}
          <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-6 shadow-sm space-y-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1F1F21]">
              <FileText className="w-5 h-5 text-[#F2A30F]" />
              <h3 className="font-bold text-white text-base">Leitor de Nota Fiscal / Romaneio</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                Opção A: Upload da Foto/Scan do Comprovante de Entrega
              </label>
              <div className="border-2 border-dashed border-[#1F1F21] hover:border-[#F2A30F] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#151517]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="invoice-upload"
                />
                <label htmlFor="invoice-upload" className="cursor-pointer space-y-1 block">
                  <Upload className="w-6 h-6 text-[#666666] mx-auto" />
                  <span className="text-xs font-semibold text-[#F2A30F] block">
                    {invoiceImage ? '✓ Imagem Selecionada (Clique p/ Trocar)' : 'Clique para selecionar imagem (JPG/PNG)'}
                  </span>
                  <span className="text-[10px] text-[#666666] block">Tire foto da nota fiscal do fornecedor no canteiro</span>
                </label>
              </div>
              {invoiceImage && (
                <div className="mt-2 relative rounded-lg overflow-hidden border border-[#1F1F21] max-h-40">
                  <img src={invoiceImage} alt="Comprovante" className="w-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A0A0A0] mb-1">
                Opção B: Cola de Texto / Pedido do WhatsApp
              </label>
              <textarea
                rows={4}
                placeholder="Cole o texto da nota fiscal ou pedido. Exemplo: 'Entregue por Votorantim NF 4012: 100 sacos de cimento CP II R$ 36.50, 10m3 de areia media R$ 115.00'"
                value={invoiceText}
                onChange={(e) => setInvoiceText(e.target.value)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2.5 text-white placeholder-[#666666] focus:border-[#F2A30F] outline-none text-xs"
              />
            </div>

            <button
              onClick={handleParseInvoice}
              disabled={parsingInvoice}
              className="w-full py-3 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold rounded-xl text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {parsingInvoice ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Lendo Comprovante com Visão Computacional IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extrair Insumos do Comprovante
                </>
              )}
            </button>
          </div>

          {/* Invoice Output Panel */}
          <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#1F1F21]">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Itens Identificados no Romaneio
                </h3>
              </div>

              {!invoiceResult ? (
                <div className="py-12 text-center text-[#666666] space-y-2">
                  <FileText className="w-12 h-12 text-[#333333] mx-auto" />
                  <p className="text-xs">
                    Faça upload da foto do romaneio de entrega ou cole o texto do pedido para dar entrada automática no almoxarifado.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-4 text-xs">
                  <div className="p-3 bg-[#151517] text-white rounded-xl border border-[#1F1F21] flex items-center justify-between">
                    <div>
                      <span className="text-[#888888] block text-[10px]">Fornecedor</span>
                      <strong className="text-[#F2A30F] text-sm">{invoiceResult.supplier || 'Não identificado'}</strong>
                    </div>
                    <div>
                      <span className="text-[#888888] block text-[10px]">Número da NF</span>
                      <span className="font-mono text-xs font-bold text-emerald-400">{invoiceResult.invoiceNumber || 'NF-SEM-NUM'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {invoiceResult.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-[#151517] border border-[#1F1F21] rounded-xl flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-white">{item.name}</h4>
                          <span className="text-[11px] text-[#888888]">{item.category}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-mono font-bold text-emerald-400">
                            +{item.quantity} {item.unit}
                          </span>
                          <span className="block text-[11px] font-mono text-[#888888]">
                            R$ {item.unitPrice.toFixed(2)}/un
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {invoiceResult && (
              <div className="pt-3 border-t border-[#1F1F21]">
                <button
                  onClick={handleImportInvoiceToStock}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  Dar Entrada Automática em Todos no Estoque
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STOCK AUDIT & RISK ANALYSIS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#F2A30F]" />
                Auditoria Preditiva de Riscos e Validades
              </h3>
              <p className="text-xs text-[#888888] mt-0.5">
                A IA analisa prazos de validade do cimento/químicos, avarias por umidade e riscos de interrupção em canteiros ativos.
              </p>
            </div>

            <button
              onClick={handleAnalyzeStock}
              disabled={analyzingStock}
              className="px-5 py-2.5 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {analyzingStock ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Auditando Estoque...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Executar Auditoria IA
                </>
              )}
            </button>
          </div>

          {!auditResult ? (
            <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-12 text-center text-[#666666] space-y-2 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-[#333333] mx-auto" />
              <p className="text-xs">
                Clique no botão <strong>"Executar Auditoria IA"</strong> acima para verificar preventivamente seu almoxarifado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Critical Alerts */}
              <div className="bg-[#0F0F11] rounded-2xl border border-amber-500/30 p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-[#F2A30F] text-sm flex items-center gap-2 border-b border-[#1F1F21] pb-2">
                  <ShieldAlert className="w-4 h-4 text-[#F2A30F]" /> Alertas Críticos ({auditResult.criticalAlerts.length})
                </h4>
                <div className="space-y-2 text-xs">
                  {auditResult.criticalAlerts.map((alert, idx) => (
                    <div key={idx} className="p-3 bg-[#151517] border border-amber-500/20 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-white font-bold">{alert.materialName}</strong>
                        <span className="text-[10px] font-bold bg-amber-950 text-[#F2A30F] border border-amber-500/30 px-2 py-0.5 rounded">
                          Risco: {alert.severity}
                        </span>
                      </div>
                      <p className="text-[#E0E0E0]">{alert.issue}</p>
                      <p className="text-[#F2A30F] font-semibold text-[11px] mt-1">Ação: {alert.recommendedAction}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchasing Suggestions */}
              <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-[#1F1F21] pb-2">
                  <HardHat className="w-4 h-4 text-blue-400" /> Sugestões de Compras Emergenciais
                </h4>
                <div className="space-y-2 text-xs">
                  {auditResult.purchasingSuggestions.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#151517] border border-[#1F1F21] rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-white">{item.materialName}</strong>
                        <span className="font-mono font-bold text-blue-400">
                          +{item.suggestedQty} {item.unit}
                        </span>
                      </div>
                      <p className="text-[#888888] text-[11px]">{item.urgencyReason}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Storage Optimization Tips */}
              <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] p-5 shadow-sm space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2 border-b border-[#1F1F21] pb-2">
                  <Lightbulb className="w-4 h-4 text-emerald-400" /> Dicas de Armazenagem do Canteiro
                </h4>
                <ul className="space-y-2 text-xs text-[#E0E0E0]">
                  {auditResult.storageOptimizationTips.map((tip, idx) => (
                    <li key={idx} className="p-2.5 bg-[#151517] border border-[#1F1F21] rounded-xl flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
