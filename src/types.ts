export type MaterialCategory =
  | 'Cimento e Agregados'
  | 'Aço e Estrutura'
  | 'Alvenaria e Blocos'
  | 'Argamassas e Selantes'
  | 'Tubos e Conexões'
  | 'Pintura e Acabamento'
  | 'Madeiras e Fôrmas'
  | 'Elétrica'
  | 'Cobertura'
  | 'Equipamentos e EPIs'
  | 'Outros';

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'DEVOLUCAO';

export type WorkPhase =
  | 'Fundação'
  | 'Estrutura / Concretagem'
  | 'Alvenaria / Vedação'
  | 'Instalações Hidráulicas'
  | 'Instalações Elétricas'
  | 'Cobertura e Telhado'
  | 'Revestimento e Piso'
  | 'Pintura e Acabamento'
  | 'Limpeza e Manutenção';

export interface MaterialItem {
  id: string;
  code: string; // SKU / Código ex: "INS-012"
  name: string;
  category: MaterialCategory;
  quantity: number;
  minQuantity: number; // Estoque mínimo para disparo de alerta
  unit: string; // 'Saco 50kg', 'm³', 'kg', 'Barra 12m', 'Unidade', 'Lata 18L', etc.
  avgUnitPrice: number; // Valor médio R$
  location: string; // ex: "Almoxarifado Central", "Pátio 1"
  supplier: string;
  details?: string; // ex: "Especificação / Cor / Variação"
  detailsOptions?: string[]; // ex: ["Vermelho", "Azul", "Preto", "Branco"]
  expiryDate?: string; // Validade (importante p/ Cimento, Argamassas, Resinas)
  batchNumber?: string;
  lastUpdated: string;
  notes?: string;
  workSiteId?: string;
  workSiteName?: string;
}

export interface StockMovement {
  id: string;
  date: string;
  type: MovementType;
  materialId: string;
  materialName: string;
  itemDetail?: string; // ex: "Cor: Vermelho" ou "Azul"
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice?: number;
  workSiteId?: string;
  workSiteName?: string;
  workPhase?: WorkPhase;
  invoiceNumber?: string; // NF-e / Romaneio
  responsible: string; // Nome do almoxarife ou mestre de obras
  notes?: string;
}

export interface MaterialRequisitionItem {
  materialId?: string;
  materialName: string;
  quantity: number;
  unit: string;
  notes?: string;
}

export interface MaterialRequisition {
  id: string;
  code: string;
  date: string;
  workSiteId: string;
  workSiteName: string;
  requesterName: string;
  requesterRole: string;
  workPhase?: WorkPhase;
  items: MaterialRequisitionItem[];
  status: 'Pendente' | 'Aprovado' | 'Em Cotação' | 'Atendido' | 'Cancelado';
  priority: 'Alta' | 'Média' | 'Baixa';
  notes?: string;
}

export interface WorkSite {
  id: string;
  code: string;
  name: string;
  address: string;
  engineerInCharge: string;
  status: 'Em Andamento' | 'Planejamento' | 'Concluída';
  budgetMaterials: number;
  totalSpentMaterials: number;
  startDate: string;
}

export interface AIEstimateItem {
  name: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  notes?: string;
}

export interface AIEstimateResult {
  summary: string;
  items: AIEstimateItem[];
  safetyLossMarginPct: number;
}

export interface ParsedInvoiceItem {
  name: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  batchCode?: string;
  location?: string;
}

export interface ParsedInvoiceResult {
  supplier: string;
  invoiceNumber: string;
  date: string;
  items: ParsedInvoiceItem[];
}

export interface StockAlertAI {
  criticalAlerts: {
    materialName: string;
    issue: string;
    severity: 'Alta' | 'Média' | 'Baixa';
    recommendedAction: string;
  }[];
  purchasingSuggestions: {
    materialName: string;
    suggestedQty: number;
    unit: string;
    urgencyReason: string;
  }[];
  storageOptimizationTips: string[];
}

export type UserRole =
  | 'Coordenador de Obra'
  | 'Engenheiro/a'
  | 'Engenheira/o'
  | 'Engenheiro Residente'
  | 'Almoxarife'
  | 'Mestre de Obras'
  | 'Gerente de Compras'
  | 'Administrador';

export type UserStatus = 'ATIVO' | 'INATIVO';

// Role Permission Helpers

export const canManageWorksites = (role?: string): boolean => {
  if (!role) return false;
  const norm = role.toLowerCase().trim();
  return norm === 'administrador' || norm === 'admin';
};

export const canManageUsers = (role?: string): boolean => {
  if (!role) return false;
  const norm = role.toLowerCase().trim();
  return norm === 'administrador' || norm === 'admin';
};

export const canCreateOrEditMovements = (role?: string): boolean => {
  if (!role) return false;
  const norm = role.toLowerCase().trim();
  // Coordenador and Engenheiro are strictly read-only for movements
  if (
    norm.includes('engenheiro') ||
    norm.includes('engenheira') ||
    norm.includes('coordenador')
  ) {
    return false;
  }
  // Administrador and Almoxarife can execute movements
  return norm === 'administrador' || norm === 'admin' || norm.includes('almoxarife');
};

export const canCreateOrEditCatalog = (role?: string): boolean => {
  if (!role) return false;
  const norm = role.toLowerCase().trim();
  // Administrador and Almoxarife can edit catalog
  return norm === 'administrador' || norm === 'admin' || norm.includes('almoxarife');
};

export const canCreateRequisitions = (role?: string): boolean => {
  if (!role) return false;
  const norm = role.toLowerCase().trim();
  return (
    norm === 'administrador' ||
    norm === 'admin' ||
    norm.includes('mestre') ||
    norm.includes('almoxarife') ||
    norm.includes('gerente')
  );
};

export const canManagePurchases = (role?: string): boolean => {
  if (!role) return false;
  const norm = role.toLowerCase().trim();
  return norm === 'administrador' || norm === 'admin' || norm.includes('gerente');
};

export const isReadOnlyRole = (role?: string): boolean => {
  if (!role) return false;
  const norm = role.toLowerCase().trim();
  return (
    norm.includes('engenheiro') ||
    norm.includes('engenheira') ||
    norm.includes('coordenador')
  );
};

export const isWorksiteLockedRole = (role?: string): boolean => {
  if (!role) return false;
  const norm = role.toLowerCase().trim();
  return norm.includes('almoxarife');
};

export const isGlobalWorksiteRole = (role?: string): boolean => {
  if (!role) return false;
  const norm = role.toLowerCase().trim();
  return (
    norm.includes('coordenador') ||
    norm.includes('engenheiro') ||
    norm.includes('engenheira') ||
    norm === 'administrador' ||
    norm === 'admin' ||
    norm.includes('gerente')
  );
};

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  status?: UserStatus;
  mustChangePassword?: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
  worksiteAssigned?: string;
  worksiteId?: string;
  worksitesAllowed?: string[];
}

export const filterMovementsByWorksite = (
  movements: StockMovement[] = [],
  selectedWorksiteId: string,
  worksites: WorkSite[] = []
): StockMovement[] => {
  if (!selectedWorksiteId || selectedWorksiteId === 'ALL') {
    return movements;
  }
  const targetWorksite = worksites.find(
    (w) => w.id === selectedWorksiteId || w.name === selectedWorksiteId
  );
  const targetId = targetWorksite ? targetWorksite.id : selectedWorksiteId;
  const targetName = (targetWorksite ? targetWorksite.name : selectedWorksiteId)
    .toLowerCase()
    .trim();

  return movements.filter((m) => {
    if (m.workSiteId && m.workSiteId === targetId) return true;
    if (m.workSiteName && m.workSiteName.toLowerCase().trim() === targetName) return true;
    if (m.workSiteName && m.workSiteName.toLowerCase().trim().includes(targetName)) return true;
    return false;
  });
};

export const filterMaterialsByWorksite = (
  materials: MaterialItem[] = [],
  selectedWorksiteId: string,
  worksites: WorkSite[] = [],
  movements: StockMovement[] = []
): MaterialItem[] => {
  if (!selectedWorksiteId || selectedWorksiteId === 'ALL') {
    return materials;
  }
  const targetWorksite = worksites.find(
    (w) => w.id === selectedWorksiteId || w.name === selectedWorksiteId
  );
  const targetId = targetWorksite ? targetWorksite.id : selectedWorksiteId;
  const targetName = (targetWorksite ? targetWorksite.name : selectedWorksiteId)
    .toLowerCase()
    .trim();

  // Movements for this worksite
  const worksiteMovements = movements.filter((m) => {
    if (m.workSiteId && m.workSiteId === targetId) return true;
    if (m.workSiteName && m.workSiteName.toLowerCase().trim() === targetName) return true;
    if (m.workSiteName && m.workSiteName.toLowerCase().trim().includes(targetName)) return true;
    return false;
  });
  const materialIdsInWorksiteMovements = new Set(worksiteMovements.map((m) => m.materialId));

  return materials.filter((item) => {
    if (item.workSiteId && item.workSiteId === targetId) return true;
    if (item.workSiteName && item.workSiteName.toLowerCase().trim() === targetName) return true;
    if (item.location && item.location.toLowerCase().trim().includes(targetName)) return true;
    if (materialIdsInWorksiteMovements.has(item.id)) return true;

    return false;
  });
};

// ------------------------------------------------------------------
// GLOBAL CATALOG & WORKSITE STOCK DATA MODELS
// ------------------------------------------------------------------

export interface DetalhesAdicionaisInsumo {
  fabricante?: string;
  marca?: string;
  modelo?: string;
  especificacaoTecnica?: string;
  codigoBarras?: string;
  normaTecnica?: string;
  dimensoes?: string;
  material?: string;
  arquivoFichaTecnica?: string;
  [key: string]: any;
}

export interface CatalogoInsumo {
  id: string;
  codigoExterno: string; // e.g., "SIENGE-908"
  nome: string;
  categoria: MaterialCategory;
  subcategoria: string;
  unidade: string;
  precoUnitario: number;
  ativo: boolean;
  observacoes: string;
  paginaFonte?: string;
  detalhesAdicionais?: DetalhesAdicionaisInsumo;
  criadoEm: string;
  atualizadoEm: string;
}

export interface EstoqueCanteiro {
  id: string; // Key e.g., `${canteiroId}_${insumoId}`
  canteiroId: string;
  insumoId: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  localArmazenamento: string;
  observacoesDoCanteiro?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type TipoAlteracaoHistorico =
  | 'IMPORTACAO_CSV'
  | 'CRIACAO'
  | 'EDICAO_GLOBAL'
  | 'INATIVACAO'
  | 'REATIVACAO'
  | 'CONFIG_ESTOQUE_CANTEIRO'
  | 'EDICAO_ESTOQUE_CANTEIRO';

export interface HistoricoAlteracaoInsumo {
  id: string;
  insumoId: string;
  insumoCodigoExterno: string;
  insumoNome?: string;
  usuarioId?: string;
  usuarioNome: string;
  dataHora: string;
  tipoAlteracao: TipoAlteracaoHistorico;
  campoAlterado: string;
  informacaoAnterior?: string;
  informacaoNova: string;
}

export interface CsvInsumoParsedRow {
  rowNumber: number;
  codigoExterno: string;
  nome: string;
  categoria: MaterialCategory;
  subcategoria: string;
  unidade: string;
  precoUnitario: number;
  ativo: boolean;
  observacoes: string;
  paginaFonte: string;
  rawLine: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface CsvPreviewSummary {
  totalFound: number;
  toCreate: CsvInsumoParsedRow[];
  toUpdate: { row: CsvInsumoParsedRow; existingItem: CatalogoInsumo; diffs: string[] }[];
  ignored: CsvInsumoParsedRow[];
  errors: { row: CsvInsumoParsedRow; reason: string }[];
}

export interface CsvFinalReport {
  totalReadRows: number;
  importedCount: number;
  updatedCount: number;
  ignoredCount: number;
  duplicatesCount: number;
  errorCount: number;
  byCategory: Record<string, number>;
  errorsList: { rowNumber: number; code: string; name: string; reason: string }[];
  importedList: { code: string; name: string; status: 'CRIADO' | 'ATUALIZADO' }[];
}



