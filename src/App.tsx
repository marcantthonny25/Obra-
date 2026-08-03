import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MaterialsView } from './components/MaterialsView';
import { MovementsView } from './components/MovementsView';
import { WorksitesView } from './components/WorksitesView';
import { AIAssistantView } from './components/AIAssistantView';
import { AnalyticsView } from './components/AnalyticsView';
import { QuickMovementModal } from './components/QuickMovementModal';
import { MaterialFormModal } from './components/MaterialFormModal';
import { MaterialItem, StockMovement, WorkSite } from './types';
import { INITIAL_MATERIALS, INITIAL_MOVEMENTS, INITIAL_WORKSITES } from './data/initialData';

const LOCAL_STORAGE_KEY_MATERIALS = 'estoque_civil_materials_v1';
const LOCAL_STORAGE_KEY_MOVEMENTS = 'estoque_civil_movements_v1';
const LOCAL_STORAGE_KEY_WORKSITES = 'estoque_civil_worksites_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'materials' | 'movements' | 'worksites' | 'ai' | 'analytics'>('materials');

  // Load from localStorage or default
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_MATERIALS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse materials from localStorage', e);
      }
    }
    return INITIAL_MATERIALS;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_MOVEMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse movements from localStorage', e);
      }
    }
    return INITIAL_MOVEMENTS;
  });

  const [worksites, setWorksites] = useState<WorkSite[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_WORKSITES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse worksites from localStorage', e);
      }
    }
    return INITIAL_WORKSITES;
  });

  // Modals state
  const [isQuickMovementOpen, setIsQuickMovementOpen] = useState(false);
  const [preSelectedMaterialId, setPreSelectedMaterialId] = useState<string | undefined>(undefined);

  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<MaterialItem | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_MATERIALS, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_WORKSITES, JSON.stringify(worksites));
  }, [worksites]);

  // Open Movement Modal for specific material
  const handleOpenQuickMovement = (materialId?: string) => {
    setPreSelectedMaterialId(materialId);
    setIsQuickMovementOpen(true);
  };

  // Add a Stock Movement
  const handleAddMovement = (
    movementData: Omit<StockMovement, 'id' | 'date'>,
    updatedUnitPrice?: number
  ) => {
    const newMovement: StockMovement = {
      ...movementData,
      id: `mov-${Date.now()}`,
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    };

    // Update Movements List
    setMovements((prev) => [newMovement, ...prev]);

    // Update Material Stock Quantity
    setMaterials((prev) =>
      prev.map((mat) => {
        if (mat.id === movementData.materialId) {
          let newQty = mat.quantity;
          if (movementData.type === 'ENTRADA' || movementData.type === 'DEVOLUCAO') {
            newQty += movementData.quantity;
          } else if (movementData.type === 'SAIDA' || movementData.type === 'AJUSTE') {
            newQty = Math.max(0, newQty - movementData.quantity);
          }

          return {
            ...mat,
            quantity: newQty,
            avgUnitPrice: updatedUnitPrice !== undefined ? updatedUnitPrice : mat.avgUnitPrice,
            lastUpdated: new Date().toISOString().slice(0, 10),
          };
        }
        return mat;
      })
    );

    // If SAIDA with Worksite, update Worksite total spent
    if (movementData.type === 'SAIDA' && movementData.workSiteId && movementData.totalPrice) {
      setWorksites((prev) =>
        prev.map((site) => {
          if (site.id === movementData.workSiteId) {
            return {
              ...site,
              totalSpentMaterials: site.totalSpentMaterials + (movementData.totalPrice || 0),
            };
          }
          return site;
        })
      );
    }
  };

  // Create or Edit Material Item
  const handleSaveMaterial = (
    materialData: Omit<MaterialItem, 'id' | 'lastUpdated'>,
    id?: string
  ) => {
    if (id) {
      // Edit
      setMaterials((prev) =>
        prev.map((mat) =>
          mat.id === id
            ? { ...materialData, id, lastUpdated: new Date().toISOString().slice(0, 10) }
            : mat
        )
      );
    } else {
      // Create New
      const newMaterial: MaterialItem = {
        ...materialData,
        id: `mat-${Date.now()}`,
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
      setMaterials((prev) => [newMaterial, ...prev]);
    }
  };

  // Delete Material
  const handleDeleteMaterial = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este insumo do catálogo?')) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Add Worksite
  const handleAddWorksite = (worksiteData: Omit<WorkSite, 'id' | 'totalSpentMaterials'>) => {
    const newWorksite: WorkSite = {
      ...worksiteData,
      id: `obra-${Date.now()}`,
      totalSpentMaterials: 0,
    };
    setWorksites((prev) => [newWorksite, ...prev]);
  };

  // Batch Add Materials from AI Estimator
  const handleBatchAddMaterials = (items: Omit<MaterialItem, 'id' | 'lastUpdated'>[]) => {
    const newItems: MaterialItem[] = items.map((item, idx) => ({
      ...item,
      id: `mat-ai-${Date.now()}-${idx}`,
      lastUpdated: new Date().toISOString().slice(0, 10),
    }));

    setMaterials((prev) => [...newItems, ...prev]);
  };

  // Batch Stock In from AI Invoice Parser
  const handleBatchStockIn = (
    items: { name: string; quantity: number; unitPrice?: number; category: any; unit: string }[]
  ) => {
    const today = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    const newMovements: StockMovement[] = [];

    items.forEach((item, idx) => {
      // Check if material exists
      let mat = materials.find((m) => m.name.toLowerCase() === item.name.toLowerCase());
      let matId = mat?.id;

      if (!mat) {
        // Create new material item
        matId = `mat-inv-${Date.now()}-${idx}`;
        const newMat: MaterialItem = {
          id: matId,
          code: `INS-${Math.floor(300 + Math.random() * 600)}`,
          name: item.name,
          category: item.category || 'Outros',
          quantity: item.quantity,
          minQuantity: Math.ceil(item.quantity * 0.2),
          unit: item.unit || 'Unidade',
          avgUnitPrice: item.unitPrice || 0,
          location: 'Almoxarifado Principal',
          supplier: 'Fornecedor Nota Fiscal',
          lastUpdated: new Date().toISOString().slice(0, 10),
        };

        setMaterials((prev) => [newMat, ...prev]);
      } else {
        // Update existing stock
        setMaterials((prev) =>
          prev.map((m) =>
            m.id === matId
              ? {
                  ...m,
                  quantity: m.quantity + item.quantity,
                  avgUnitPrice: item.unitPrice ? item.unitPrice : m.avgUnitPrice,
                }
              : m
          )
        );
      }

      newMovements.push({
        id: `mov-inv-${Date.now()}-${idx}`,
        date: today,
        type: 'ENTRADA',
        materialId: matId,
        materialName: item.name,
        quantity: item.quantity,
        unit: item.unit || 'Unidade',
        unitPrice: item.unitPrice || 0,
        totalPrice: (item.unitPrice || 0) * item.quantity,
        responsible: 'Importação Nota Fiscal IA',
      });
    });

    setMovements((prev) => [...newMovements, ...prev]);
  };

  // Import Backup JSON
  const handleImportBackupJSON = (data: {
    materials: MaterialItem[];
    movements: StockMovement[];
    worksites: WorkSite[];
  }) => {
    setMaterials(data.materials);
    setMovements(data.movements);
    setWorksites(data.worksites);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] font-sans text-[#E0E0E0] flex flex-col antialiased selection:bg-[#F2A30F] selection:text-black">
      {/* Navigation Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        materials={materials}
        onOpenNewMovement={() => handleOpenQuickMovement()}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'materials' && (
          <MaterialsView
            materials={materials}
            onOpenNewMaterial={() => {
              setMaterialToEdit(null);
              setIsMaterialFormOpen(true);
            }}
            onEditMaterial={(mat) => {
              setMaterialToEdit(mat);
              setIsMaterialFormOpen(true);
            }}
            onDeleteMaterial={handleDeleteMaterial}
            onOpenQuickMovement={handleOpenQuickMovement}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsView
            movements={movements}
            worksites={worksites}
            onOpenNewMovement={() => handleOpenQuickMovement()}
          />
        )}

        {activeTab === 'worksites' && (
          <WorksitesView
            worksites={worksites}
            movements={movements}
            onAddWorksite={handleAddWorksite}
            onOpenQuickMovement={() => handleOpenQuickMovement()}
          />
        )}

        {activeTab === 'ai' && (
          <AIAssistantView
            materials={materials}
            worksites={worksites}
            onBatchAddMaterials={handleBatchAddMaterials}
            onBatchStockIn={handleBatchStockIn}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            materials={materials}
            movements={movements}
            worksites={worksites}
            onImportBackupJSON={handleImportBackupJSON}
          />
        )}
      </main>

      {/* Quick Movement Modal */}
      <QuickMovementModal
        isOpen={isQuickMovementOpen}
        onClose={() => setIsQuickMovementOpen(false)}
        materials={materials}
        worksites={worksites}
        preSelectedMaterialId={preSelectedMaterialId}
        onAddMovement={handleAddMovement}
      />

      {/* Create / Edit Material Modal */}
      <MaterialFormModal
        isOpen={isMaterialFormOpen}
        onClose={() => setIsMaterialFormOpen(false)}
        materialToEdit={materialToEdit}
        onSaveMaterial={handleSaveMaterial}
      />

      {/* Footer */}
      <footer className="bg-[#0F0F11] border-t border-[#1F1F21] text-[#888888] py-6 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Estoque Civil Pro — Sistema de Controle de Insumos para Construção Civil</p>
          <div className="flex items-center gap-4 text-[#888888]">
            <span>NBR/ABNT Compliant</span>
            <span>•</span>
            <span>Gestão de Canteiros de Obras</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
