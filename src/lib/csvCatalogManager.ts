import {
  CatalogoInsumo,
  CsvInsumoParsedRow,
  CsvPreviewSummary,
  CsvFinalReport,
  MaterialCategory,
  EstoqueCanteiro,
  HistoricoAlteracaoInsumo,
  User,
} from '../types';
import { db, sanitizeForFirestore, assertNoUndefined } from './firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';

const VALID_CATEGORIES: MaterialCategory[] = [
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

/**
  Normalizes category string from CSV to one of our valid MaterialCategory options
 */
export function normalizeCategory(catStr: string): MaterialCategory {
  if (!catStr) return 'Outros';
  const clean = catStr.trim().toLowerCase();

  if (clean.includes('cimento') || clean.includes('agregado') || clean.includes('aglomerante')) return 'Cimento e Agregados';
  if (clean.includes('aço') || clean.includes('aco') || clean.includes('estrutura') || clean.includes('armadura') || clean.includes('espaçador')) return 'Aço e Estrutura';
  if (clean.includes('alvenaria') || clean.includes('bloco') || clean.includes('vedação') || clean.includes('vedacao')) return 'Alvenaria e Blocos';
  if (clean.includes('argamassa') || clean.includes('selante') || clean.includes('adesivo') || clean.includes('aditivo')) return 'Argamassas e Selantes';
  if (clean.includes('tubo') || clean.includes('conexã') || clean.includes('conexa') || clean.includes('hidro') || clean.includes('gás') || clean.includes('gas')) return 'Tubos e Conexões';
  if (clean.includes('pintura') || clean.includes('acabamento') || clean.includes('tinta') || clean.includes('mármore') || clean.includes('granito') || clean.includes('piso') || clean.includes('revestimento')) return 'Pintura e Acabamento';
  if (clean.includes('madeira') || clean.includes('fôrma') || clean.includes('forma')) return 'Madeiras e Fôrmas';
  if (clean.includes('elétrica') || clean.includes('eletrica') || clean.includes('fio') || clean.includes('cabo') || clean.includes('quadro') || clean.includes('disjuntor')) return 'Elétrica';
  if (clean.includes('cobertura') || clean.includes('forro') || clean.includes('telha')) return 'Cobertura';
  if (clean.includes('equipamento') || clean.includes('epi') || clean.includes('segurança') || clean.includes('seguranca') || clean.includes('elevador') || clean.includes('pci') || clean.includes('spda')) return 'Equipamentos e EPIs';

  const exactMatch = VALID_CATEGORIES.find((c) => c.toLowerCase() === clean);
  return exactMatch || 'Outros';
}

/**
  Parses Brazilian formatted decimal string ("16,8700" or "0,0000" or "100.00")
 */
export function parseBrazilianNumber(val: string | undefined): number {
  if (!val) return 0;
  const clean = val.trim().replace(/"/g, '');
  if (!clean) return 0;

  // Handle "16,8700" -> "16.8700"
  if (clean.includes(',')) {
    const formatted = clean.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(formatted);
    return isNaN(parsed) ? 0 : parsed;
  }

  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
  Parses CSV content line by line handling quotes and multi-line fields properly
 */
export function parseCsvText(csvContent: string): CsvInsumoParsedRow[] {
  if (!csvContent) return [];

  // Remove UTF-8 BOM if present
  const text = csvContent.startsWith('\uFEFF') ? csvContent.slice(1) : csvContent;

  // Split into raw rows respecting quotes across newlines
  const rawRows: string[] = [];
  let currentRow = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentRow += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
        currentRow += '"';
      }
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++;
      if (currentRow.trim()) {
        rawRows.push(currentRow);
      }
      currentRow = '';
    } else if (char === '\r' && !inQuotes) {
      if (currentRow.trim()) {
        rawRows.push(currentRow);
      }
      currentRow = '';
    } else {
      currentRow += char;
    }
  }
  if (currentRow.trim()) {
    rawRows.push(currentRow);
  }

  if (rawRows.length <= 1) return [];

  // Parse header line to discover column indexes
  const headerLine = rawRows[0];
  const delimiter = headerLine.includes(';') ? ';' : headerLine.includes('\t') ? '\t' : ',';
  const headerCols = parseCsvLine(headerLine, delimiter).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));

  // Find column indexes flexibly
  let colCode = headerCols.findIndex((h) => h.includes('código') || h.includes('codigo') || h.includes('id') || h.includes('cod') || h.includes('sku'));
  let colName = headerCols.findIndex((h) => h.includes('nome') || h.includes('insumo') || h.includes('descrição') || h.includes('descricao') || h.includes('item') || h.includes('especificacao') || h.includes('material'));
  let colCat = headerCols.findIndex((h) => (h.includes('categoria') || h.includes('cat') || h.includes('grupo')) && !h.includes('sub'));
  let colSubCat = headerCols.findIndex((h) => h.includes('subcategoria') || h.includes('subcat') || h.includes('subgrupo'));
  let colUnit = headerCols.findIndex((h) => h.includes('unidade') || h.includes('und') || h.includes('unid') || h.includes('um'));
  let colPrice = headerCols.findIndex((h) => h.includes('preço') || h.includes('preco') || h.includes('valor') || h.includes('custo'));
  let colActive = headerCols.findIndex((h) => h.includes('ativo') || h.includes('status'));
  let colNotes = headerCols.findIndex((h) => h.includes('observações') || h.includes('observacoes') || h.includes('obs'));
  let colPage = headerCols.findIndex((h) => h.includes('página') || h.includes('pagina') || h.includes('pag'));

  // Fallbacks if header matching missed
  if (colCode === -1) colCode = 0;
  if (colName === -1) colName = headerCols.length > 1 ? 1 : 0;
  if (colCat === -1) colCat = headerCols.length > 2 ? 2 : -1;
  if (colSubCat === -1) colSubCat = headerCols.length > 3 ? 3 : -1;
  if (colUnit === -1) colUnit = headerCols.length > 4 ? 4 : -1;
  if (colPrice === -1) colPrice = headerCols.length > 5 ? 5 : -1;

  const parsedRows: CsvInsumoParsedRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const rawLine = rawRows[i].trim();
    if (!rawLine) continue;

    const cols = parseCsvLine(rawLine, delimiter);
    let code = colCode >= 0 && cols[colCode] ? cols[colCode].trim().replace(/^"|"$/g, '') : '';
    let name = colName >= 0 && cols[colName] ? cols[colName].trim().replace(/^"|"$/g, '') : '';
    const rawCat = colCat >= 0 && cols[colCat] ? cols[colCat].trim().replace(/^"|"$/g, '') : '';
    const subcat = colSubCat >= 0 && cols[colSubCat] ? cols[colSubCat].trim().replace(/^"|"$/g, '') : '';
    const unit = colUnit >= 0 && cols[colUnit] ? cols[colUnit].trim().replace(/^"|"$/g, '') : '';
    const priceStr = colPrice >= 0 && cols[colPrice] ? cols[colPrice].trim() : '';
    const activeStr = colActive >= 0 && cols[colActive] ? cols[colActive].trim().replace(/^"|"$/g, '').toLowerCase() : 'sim';
    const notes = colNotes >= 0 && cols[colNotes] ? cols[colNotes].trim().replace(/^"|"$/g, '') : '';
    const page = colPage >= 0 && cols[colPage] ? cols[colPage].trim().replace(/^"|"$/g, '') : '';

    // If code is missing but name exists, auto-generate code so valid item is NOT discarded
    if (!code && name) {
      code = `INS-${i}`;
    }

    const isValid = !!name;
    const errorMessage = !name ? 'Falta o Nome do Insumo' : undefined;

    const isActive = !(activeStr === 'não' || activeStr === 'nao' || activeStr === 'false' || activeStr === '0' || activeStr === 'inativo' || activeStr === 'n');

    parsedRows.push({
      rowNumber: i + 1,
      codigoExterno: code || `INS-${i}`,
      nome: name,
      categoria: normalizeCategory(rawCat),
      subcategoria: subcat,
      unidade: unit || 'un',
      precoUnitario: parseBrazilianNumber(priceStr),
      ativo: isActive,
      observacoes: notes,
      paginaFonte: page,
      rawLine,
      isValid,
      errorMessage,
    });
  }

  return parsedRows;
}

/**
  Parses a single CSV line accounting for quoted fields containing delimiters
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
  Validates parsed rows against current catalog to detect new vs duplicate/update items
 */
export function buildImportPreviewSummary(
  parsedRows: CsvInsumoParsedRow[],
  existingCatalog: CatalogoInsumo[]
): CsvPreviewSummary {
  const summary: CsvPreviewSummary = {
    totalFound: parsedRows.length,
    toCreate: [],
    toUpdate: [],
    ignored: [],
    errors: [],
  };

  const catalogMapByCode = new Map<string, CatalogoInsumo>();
  existingCatalog.forEach((item) => {
    if (item.codigoExterno) {
      catalogMapByCode.set(item.codigoExterno.trim().toLowerCase(), item);
    }
  });

  parsedRows.forEach((row) => {
    if (!row.isValid) {
      summary.errors.push({ row, reason: row.errorMessage || 'Dado inválido' });
      return;
    }

    const key = row.codigoExterno.trim().toLowerCase();
    const existing = catalogMapByCode.get(key);

    if (!existing) {
      summary.toCreate.push(row);
    } else {
      // Item already exists -> Check differences
      const diffs: string[] = [];
      if (existing.nome !== row.nome) diffs.push(`Nome: '${existing.nome}' ➔ '${row.nome}'`);
      if (existing.categoria !== row.categoria) diffs.push(`Categoria: '${existing.categoria}' ➔ '${row.categoria}'`);
      if (existing.subcategoria !== row.subcategoria) diffs.push(`Subcategoria: '${existing.subcategoria}' ➔ '${row.subcategoria}'`);
      if (existing.unidade !== row.unidade) diffs.push(`Unidade: '${existing.unidade}' ➔ '${row.unidade}'`);
      if (existing.precoUnitario !== row.precoUnitario) diffs.push(`Preço: R$ ${existing.precoUnitario.toFixed(2)} ➔ R$ ${row.precoUnitario.toFixed(2)}`);
      if (existing.ativo !== row.ativo) diffs.push(`Ativo: ${existing.ativo ? 'Sim' : 'Não'} ➔ ${row.ativo ? 'Sim' : 'Não'}`);

      if (diffs.length > 0) {
        summary.toUpdate.push({ row, existingItem: existing, diffs });
      } else {
        // Exactly identical
        summary.ignored.push(row);
      }
    }
  });

  return summary;
}

/**
  Executes batch import into Firestore collection `catalogoInsumos` safely in chunks
 */
export async function executeBatchImport(
  summary: CsvPreviewSummary,
  options: { updateDuplicates: boolean },
  currentUser: User | null,
  onProgress?: (pct: number, count: number) => void
): Promise<CsvFinalReport> {
  const now = new Date().toISOString();

  const rowsToProcess: { row: CsvInsumoParsedRow; isUpdate: boolean; existingId?: string; diffs?: string[] }[] = [];

  summary.toCreate.forEach((row) => {
    rowsToProcess.push({ row, isUpdate: false });
  });

  if (options.updateDuplicates) {
    summary.toUpdate.forEach(({ row, existingItem, diffs }) => {
      rowsToProcess.push({ row, isUpdate: true, existingId: existingItem.id, diffs });
    });
  }

  const byCategory: Record<string, number> = {};

  const report: CsvFinalReport = {
    totalReadRows: summary.totalFound,
    importedCount: 0,
    updatedCount: 0,
    ignoredCount: summary.ignored.length + (!options.updateDuplicates ? summary.toUpdate.length : 0),
    duplicatesCount: summary.toUpdate.length,
    errorCount: summary.errors.length,
    byCategory: {},
    errorsList: summary.errors.map((e) => ({
      rowNumber: e.row.rowNumber,
      code: e.row.codigoExterno,
      name: e.row.nome,
      reason: e.reason,
    })),
    importedList: [],
  };

  const total = rowsToProcess.length;
  if (total === 0) {
    if (onProgress) onProgress(100, 0);
    report.byCategory = byCategory;
    return report;
  }

  // Use chunks of 250 (well within Firestore 500 ops limit)
  const BATCH_SIZE = 250;
  for (let i = 0; i < total; i += BATCH_SIZE) {
    const chunk = rowsToProcess.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    chunk.forEach(({ row, isUpdate, existingId }) => {
      try {
        const insumoId = isUpdate && existingId ? existingId : `INS-${row.codigoExterno.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        const itemRef = doc(db, 'catalogoInsumos', insumoId);

        const itemData: CatalogoInsumo = {
          id: insumoId,
          codigoExterno: row.codigoExterno,
          nome: row.nome,
          categoria: row.categoria,
          subcategoria: row.subcategoria || '',
          unidade: row.unidade || 'un',
          precoUnitario: row.precoUnitario,
          ativo: row.ativo,
          observacoes: row.observacoes || '',
          paginaFonte: row.paginaFonte || '',
          criadoEm: now,
          atualizadoEm: now,
        };

        const cleanData = sanitizeForFirestore(itemData);
        assertNoUndefined(cleanData);
        batch.set(itemRef, cleanData, { merge: true });

        // Category breakdown counter
        const catName = row.categoria || 'Outros';
        byCategory[catName] = (byCategory[catName] || 0) + 1;

        if (isUpdate) {
          report.updatedCount++;
          if (report.importedList.length < 50) {
            report.importedList.push({ code: row.codigoExterno, name: row.nome, status: 'ATUALIZADO' });
          }
        } else {
          report.importedCount++;
          if (report.importedList.length < 50) {
            report.importedList.push({ code: row.codigoExterno, name: row.nome, status: 'CRIADO' });
          }
        }
      } catch (err: any) {
        report.errorCount++;
        report.errorsList.push({
          rowNumber: row.rowNumber,
          code: row.codigoExterno,
          name: row.nome,
          reason: err.message || 'Erro ao preparar lote no Firestore',
        });
      }
    });

    try {
      await batch.commit();
    } catch (commitErr: any) {
      console.error(`[Batch Import] Erro ao commitar lote ${i / BATCH_SIZE + 1}:`, commitErr);
    }

    const currentProcessed = Math.min(i + BATCH_SIZE, total);
    const progressPct = Math.round((currentProcessed / total) * 100);
    if (onProgress) {
      onProgress(progressPct, currentProcessed);
    }
  }

  report.byCategory = byCategory;
  return report;
}

/**
  Saves/Updates global item in `catalogoInsumos` and logs history
 */
export async function saveGlobalCatalogItem(
  item: CatalogoInsumo,
  previousItem: CatalogoInsumo | null,
  currentUser: User | null
): Promise<void> {
  const now = new Date().toISOString();
  const itemRef = doc(db, 'catalogoInsumos', item.id);

  const cleanItem = sanitizeForFirestore({
    ...item,
    atualizadoEm: now,
    criadoEm: item.criadoEm || now,
  });
  assertNoUndefined(cleanItem);

  await setDoc(itemRef, cleanItem, { merge: true });

  // Record Audit Trail Log
  const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const logRef = doc(db, 'historicoAlteracoesInsumos', logId);

  let tipoAlteracao: HistoricoAlteracaoInsumo['tipoAlteracao'] = 'EDICAO_GLOBAL';
  let diffTextPrev = 'Inexistente';
  let diffTextNew = `Criado com nome ${item.nome}`;

  if (previousItem) {
    if (previousItem.ativo && !item.ativo) {
      tipoAlteracao = 'INATIVACAO';
    } else if (!previousItem.ativo && item.ativo) {
      tipoAlteracao = 'REATIVACAO';
    }
    const diffsPrev: string[] = [];
    const diffsNew: string[] = [];

    if (previousItem.nome !== item.nome) {
      diffsPrev.push(`Nome: ${previousItem.nome}`);
      diffsNew.push(`Nome: ${item.nome}`);
    }
    if (previousItem.codigoExterno !== item.codigoExterno) {
      diffsPrev.push(`Código: ${previousItem.codigoExterno}`);
      diffsNew.push(`Código: ${item.codigoExterno}`);
    }
    if (previousItem.categoria !== item.categoria) {
      diffsPrev.push(`Categoria: ${previousItem.categoria}`);
      diffsNew.push(`Categoria: ${item.categoria}`);
    }
    if (previousItem.unidade !== item.unidade) {
      diffsPrev.push(`Unidade: ${previousItem.unidade}`);
      diffsNew.push(`Unidade: ${item.unidade}`);
    }
    if (previousItem.precoUnitario !== item.precoUnitario) {
      diffsPrev.push(`Preço: R$ ${previousItem.precoUnitario}`);
      diffsNew.push(`Preço: R$ ${item.precoUnitario}`);
    }
    if (previousItem.ativo !== item.ativo) {
      diffsPrev.push(`Ativo: ${previousItem.ativo}`);
      diffsNew.push(`Ativo: ${item.ativo}`);
    }

    diffTextPrev = diffsPrev.join('; ') || 'Sem alterações em campos principais';
    diffTextNew = diffsNew.join('; ') || 'Atualização de detalhes/observações';
  }

  const logData: HistoricoAlteracaoInsumo = {
    id: logId,
    insumoId: item.id,
    insumoCodigoExterno: item.codigoExterno,
    insumoNome: item.nome,
    usuarioId: currentUser?.id,
    usuarioNome: currentUser?.name || 'Administrador',
    dataHora: now,
    tipoAlteracao,
    campoAlterado: 'Edição Global de Insumo',
    informacaoAnterior: diffTextPrev,
    informacaoNova: diffTextNew,
  };

  const cleanLog = sanitizeForFirestore(logData);
  assertNoUndefined(cleanLog);
  await setDoc(logRef, cleanLog);
}

/**
  Saves/Updates canteiro stock configuration in `estoquesPorCanteiro`
 */
export async function saveWorksiteStockConfig(
  stock: EstoqueCanteiro,
  currentUser: User | null
): Promise<void> {
  const now = new Date().toISOString();
  const stockRef = doc(db, 'estoquesPorCanteiro', stock.id);

  const cleanStock = sanitizeForFirestore({
    ...stock,
    atualizadoEm: now,
    criadoEm: stock.criadoEm || now,
  });
  assertNoUndefined(cleanStock);

  await setDoc(stockRef, cleanStock, { merge: true });

  // Log in Audit Trail
  const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const logRef = doc(db, 'historicoAlteracoesInsumos', logId);

  const logData: HistoricoAlteracaoInsumo = {
    id: logId,
    insumoId: stock.insumoId,
    insumoCodigoExterno: stock.insumoId,
    insumoNome: `Estoque do Canteiro (${stock.canteiroId})`,
    usuarioId: currentUser?.id,
    usuarioNome: currentUser?.name || 'Almoxarife / Admin',
    dataHora: now,
    tipoAlteracao: 'CONFIG_ESTOQUE_CANTEIRO',
    campoAlterado: 'Configuração de Estoque por Canteiro',
    informacaoAnterior: `Estoque Mínimo anterior ou não configurado`,
    informacaoNova: `Estoque Mínimo: ${stock.estoqueMinimo}, Local: ${stock.localArmazenamento || 'N/D'}`,
  };

  const cleanLog = sanitizeForFirestore(logData);
  assertNoUndefined(cleanLog);
  await setDoc(logRef, cleanLog);
}
