import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  XCircle,
  ArrowRight,
  ShieldAlert,
  FileText,
  Download,
} from 'lucide-react';
import {
  CatalogoInsumo,
  CsvInsumoParsedRow,
  CsvPreviewSummary,
  CsvFinalReport,
  User,
  canCreateOrEditCatalog,
} from '../types';
import {
  parseCsvText,
  buildImportPreviewSummary,
  executeBatchImport,
} from '../lib/csvCatalogManager';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingCatalog: CatalogoInsumo[];
  currentUser: User | null;
  onImportCompleted: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  existingCatalog,
  currentUser,
  onImportCompleted,
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'report'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<CsvInsumoParsedRow[]>([]);
  const [previewSummary, setPreviewSummary] = useState<CsvPreviewSummary | null>(null);
  const [updateDuplicates, setUpdateDuplicates] = useState<boolean>(true);

  // Processing Progress
  const [progressPct, setProgressPct] = useState<number>(0);
  const [processedCount, setProcessedCount] = useState<number>(0);

  // Final Report
  const [finalReport, setFinalReport] = useState<CsvFinalReport | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAdminOrAuthorized = canCreateOrEditCatalog(currentUser?.role);

  // Handle file select or text read
  const handleProcessFileContent = (text: string, fileName: string) => {
    setErrorMessage(null);
    setCsvRawText(text);

    const rows = parseCsvText(text);
    if (rows.length === 0) {
      setErrorMessage('O arquivo selecionado está vazio ou possui formato inválido.');
      return;
    }

    setParsedRows(rows);
    const summary = buildImportPreviewSummary(rows, existingCatalog);
    setPreviewSummary(summary);
    setStep('preview');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessFileContent(content, selectedFile.name);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Erro ao ler o arquivo CSV.');
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setErrorMessage('Por favor, selecione um arquivo com extensão .csv');
        return;
      }
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          handleProcessFileContent(content, droppedFile.name);
        }
      };
      reader.readAsText(droppedFile, 'UTF-8');
    }
  };

  // Quick action: load default Hogar official CSV
  const handleLoadOfficialHogarCsv = async () => {
    setErrorMessage(null);
    try {
      const response = await fetch('/importacao_sugerida_insumos_hogar.csv');
      if (!response.ok) {
        throw new Error('Não foi possível carregar o arquivo CSV do servidor.');
      }
      const text = await response.text();
      handleProcessFileContent(text, 'importacao_sugerida_insumos_hogar.csv');
    } catch (err: any) {
      setErrorMessage(`Erro ao carregar CSV oficial: ${err.message}`);
    }
  };

  // Start Batch Import
  const handleConfirmImport = async () => {
    if (!previewSummary) return;

    setStep('processing');
    setProgressPct(0);
    setProcessedCount(0);

    try {
      const report = await executeBatchImport(
        previewSummary,
        { updateDuplicates },
        currentUser,
        (pct, count) => {
          setProgressPct(pct);
          setProcessedCount(count);
        }
      );

      setFinalReport(report);
      setStep('report');
      onImportCompleted();
    } catch (err: any) {
      console.error('Erro durante importação CSV:', err);
      setErrorMessage(`Falha durante a gravação em lotes: ${err.message}`);
      setStep('preview');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setCsvRawText('');
    setParsedRows([]);
    setPreviewSummary(null);
    setErrorMessage(null);
    setFinalReport(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F0F11] border border-[#222226] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-[#1F1F21] bg-[#141417] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-2xl text-[#F2A30F]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Importar Catálogo de Insumos (CSV)
              </h3>
              <p className="text-xs text-[#888888]">
                Hogar Empreendimentos • Padrão Global de Insumos sem Vínculo de Canteiro
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#888888] hover:text-white hover:bg-[#1F1F21] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!isAdminOrAuthorized ? (
            <div className="bg-red-950/40 border border-red-500/30 p-6 rounded-2xl text-center space-y-3">
              <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Permissão Negada</h4>
              <p className="text-xs text-[#A0A0A0] max-w-md mx-auto">
                Somente administradores ou usuários autorizados têm permissão para importar arquivos do Catálogo Global de Insumos.
              </p>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {errorMessage && (
                <div className="bg-red-950/50 border border-red-500/40 p-4 rounded-2xl text-red-300 text-xs flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* STEP 1: UPLOAD */}
              {step === 'upload' && (
                <div className="space-y-6">
                  <div className="bg-[#151518] border border-[#222226] p-4 rounded-2xl space-y-2 text-xs text-[#A0A0A0]">
                    <div className="font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#F2A30F]" />
                      Instruções de Importação
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#888888]">
                      <li>
                        Os insumos serão gravados no <strong className="text-white">Catálogo Global</strong> (disponíveis para todos os canteiros).
                      </li>
                      <li>
                        <strong className="text-amber-400">Estoque Mínimo, Estoque Atual e Obra</strong> do CSV serão desconsiderados. O estoque mínimo será configurado separadamente para cada canteiro na primeira movimentação.
                      </li>
                      <li>
                        A chave de identificação principal é o <strong className="text-white">ID / Código Externo</strong> (ex: <code className="text-amber-300 font-mono">SIENGE-908</code>).
                      </li>
                    </ul>
                  </div>

                  {/* Drag & Drop Box */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                      isDragging
                        ? 'border-[#F2A30F] bg-amber-500/5'
                        : 'border-[#222226] hover:border-[#333338] bg-[#121215]'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-file-input"
                    />
                    <label htmlFor="csv-file-input" className="cursor-pointer space-y-3 block">
                      <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-[#F2A30F]">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          Arraste e solte o arquivo CSV aqui ou <span className="text-[#F2A30F] underline">clique para selecionar</span>
                        </p>
                        <p className="text-xs text-[#777777] mt-1">
                          Arquivo suportado: <strong className="text-white">.CSV</strong> (separado por ponto e vírgula, codificação UTF-8)
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Quick Action: Official File */}
                  <div className="bg-[#121215] border border-[#222226] p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-400">
                        <Download className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Arquivo Sugerido Oficial da Hogar</div>
                        <div className="text-[11px] text-[#888888]">
                          Usar o arquivo oficial de insumos (<code className="text-emerald-400">importacao_sugerida_insumos_hogar.csv</code>)
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleLoadOfficialHogarCsv}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer shadow-md"
                    >
                      Carregar CSV Oficial
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PREVIEW */}
              {step === 'preview' && previewSummary && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#151518] border border-[#222226] p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-[#888888] uppercase block">Total Encontrado</span>
                      <span className="text-2xl font-black text-white">{previewSummary.totalFound}</span>
                    </div>

                    <div className="bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block">Novos (Serão Criados)</span>
                      <span className="text-2xl font-black text-emerald-400">{previewSummary.toCreate.length}</span>
                    </div>

                    <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-amber-400 uppercase block">Já Existentes</span>
                      <span className="text-2xl font-black text-amber-400">{previewSummary.toUpdate.length}</span>
                    </div>

                    <div className="bg-red-950/30 border border-red-500/30 p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-red-400 uppercase block">Incompletos / Erro</span>
                      <span className="text-2xl font-black text-red-400">{previewSummary.errors.length}</span>
                    </div>
                  </div>

                  {/* Duplicate Handling Options */}
                  {previewSummary.toUpdate.length > 0 && (
                    <div className="bg-[#151518] border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-white block">Tratamento de Duplicidades:</span>
                        <span className="text-[#888888] text-[11px]">
                          Encontrados {previewSummary.toUpdate.length} registros cujo Código Externo já existe no catálogo.
                        </span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer bg-[#1F1F23] px-3 py-2 rounded-xl border border-[#2B2B30] hover:bg-[#25252A] transition-all shrink-0">
                        <input
                          type="checkbox"
                          checked={updateDuplicates}
                          onChange={(e) => setUpdateDuplicates(e.target.checked)}
                          className="w-4 h-4 accent-[#F2A30F] rounded cursor-pointer"
                        />
                        <span className="text-white font-medium">Atualizar existentes com dados do CSV</span>
                      </label>
                    </div>
                  )}

                  {/* Table Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Prévia dos Primeiros Registros Processados
                      </h4>
                      <button
                        onClick={handleReset}
                        className="text-xs text-[#888888] hover:text-white underline cursor-pointer"
                      >
                        Trocar Arquivo
                      </button>
                    </div>

                    <div className="border border-[#222226] rounded-2xl overflow-hidden bg-[#121215]">
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-[#18181C] text-[#888888] font-bold text-[10px] uppercase sticky top-0 z-10 border-b border-[#222226]">
                            <tr>
                              <th className="p-2.5">Linha</th>
                              <th className="p-2.5">Código Externo</th>
                              <th className="p-2.5">Nome do Insumo</th>
                              <th className="p-2.5">Categoria</th>
                              <th className="p-2.5">Unidade</th>
                              <th className="p-2.5">Preço Unit.</th>
                              <th className="p-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1F1F21] text-[#CCCCCC]">
                            {parsedRows.slice(0, 30).map((r) => {
                              const isExist = previewSummary.toUpdate.some((u) => u.row.rowNumber === r.rowNumber);
                              const isErr = !r.isValid;

                              return (
                                <tr key={r.rowNumber} className="hover:bg-[#1A1A1E]">
                                  <td className="p-2.5 font-mono text-[#888888]">{r.rowNumber}</td>
                                  <td className="p-2.5 font-mono font-bold text-amber-400">{r.codigoExterno}</td>
                                  <td className="p-2.5 font-medium text-white max-w-[200px] truncate" title={r.nome}>
                                    {r.nome}
                                  </td>
                                  <td className="p-2.5 text-[#A0A0A0]">{r.categoria}</td>
                                  <td className="p-2.5 text-[#A0A0A0]">{r.unidade}</td>
                                  <td className="p-2.5 font-mono text-emerald-400">R$ {r.precoUnitario.toFixed(2)}</td>
                                  <td className="p-2.5">
                                    {isErr ? (
                                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Erro
                                      </span>
                                    ) : isExist ? (
                                      <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Existente
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                        Novo
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      {parsedRows.length > 30 && (
                        <div className="p-2 text-center text-[10px] text-[#777777] bg-[#151518] border-t border-[#1F1F21]">
                          Exibindo as primeiras 30 de {parsedRows.length} linhas do arquivo.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PROCESSING */}
              {step === 'processing' && (
                <div className="py-12 text-center space-y-6">
                  <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                    <RefreshCw className="w-12 h-12 text-[#F2A30F] animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Importando Catálogo Global...</h4>
                    <p className="text-xs text-[#888888] mt-1">
                      Gravando insumos em lotes seguros no banco de dados. Processados {processedCount} registros.
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="max-w-md mx-auto space-y-2">
                    <div className="w-full bg-[#1A1A1E] h-3 rounded-full overflow-hidden border border-[#2B2B30]">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-400">{progressPct}% concluído</div>
                  </div>
                </div>
              )}

              {/* STEP 4: FINAL REPORT */}
              {step === 'report' && finalReport && (
                <div className="space-y-6">
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl flex items-center gap-3 text-emerald-300">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Importação Concluída com Sucesso!</h4>
                      <p className="text-xs text-emerald-300/80">
                        O Catálogo Global de Insumos da Hogar foi atualizado e está sincronizado para todos os canteiros.
                      </p>
                    </div>
                  </div>

                  {/* Metrics Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#151518] border border-emerald-500/30 p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block">Criados</span>
                      <span className="text-2xl font-black text-emerald-400">{finalReport.importedCount}</span>
                    </div>

                    <div className="bg-[#151518] border border-amber-500/30 p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-amber-400 uppercase block">Atualizados</span>
                      <span className="text-2xl font-black text-amber-400">{finalReport.updatedCount}</span>
                    </div>

                    <div className="bg-[#151518] border border-[#222226] p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-[#888888] uppercase block">Ignorados / Sem Alteração</span>
                      <span className="text-2xl font-black text-[#A0A0A0]">{finalReport.ignoredCount}</span>
                    </div>

                    <div className="bg-[#151518] border border-red-500/30 p-3.5 rounded-2xl text-center">
                      <span className="text-[10px] font-bold text-red-400 uppercase block">Erros</span>
                      <span className="text-2xl font-black text-red-400">{finalReport.errorCount}</span>
                    </div>
                  </div>

                  {/* Errors Detail if any */}
                  {finalReport.errorsList.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" /> Relatório de Erros ({finalReport.errorsList.length})
                      </h5>
                      <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-3 max-h-40 overflow-y-auto space-y-1.5 text-xs text-red-300">
                        {finalReport.errorsList.map((e, idx) => (
                          <div key={idx} className="flex items-center justify-between border-b border-red-500/20 pb-1">
                            <span>
                              Linha {e.rowNumber} [{e.code || 'S/CÓDigo'}]: {e.name || 'Sem nome'}
                            </span>
                            <span className="font-bold text-red-400">{e.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1F1F21] bg-[#141417] flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#1F1F21] transition-all cursor-pointer"
          >
            {step === 'report' ? 'Fechar' : 'Cancelar'}
          </button>

          {step === 'preview' && isAdminOrAuthorized && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#A0A0A0] hover:text-white bg-[#1A1A1E] hover:bg-[#25252A] transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmImport}
                className="bg-[#F2A30F] hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                Confirmar Importação de {previewSummary?.toCreate.length! + (updateDuplicates ? (previewSummary?.toUpdate.length || 0) : 0)} Insumos
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'report' && (
            <button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Concluir e Ir para o Catálogo
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
