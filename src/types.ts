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
  expiryDate?: string; // Validade (importante p/ Cimento, Argamassas, Resinas)
  batchNumber?: string;
  lastUpdated: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  date: string;
  type: MovementType;
  materialId: string;
  materialName: string;
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
