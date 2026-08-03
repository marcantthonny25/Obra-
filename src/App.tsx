import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MaterialsView } from './components/MaterialsView';
import { MovementsView } from './components/MovementsView';
import { WorksitesView } from './components/WorksitesView';
import { AIAssistantView } from './components/AIAssistantView';
import { AnalyticsView } from './components/AnalyticsView';
import { QuickMovementModal } from './components/QuickMovementModal';
import { MaterialFormModal } from './components/MaterialFormModal';
import { WorksiteFormModal } from './components/WorksiteFormModal';
import { EditMovementModal } from './components/EditMovementModal';
import { AuthModal } from './components/AuthModal';
import { MaterialItem, StockMovement, WorkSite, User } from './types';
import { INITIAL_MATERIALS, INITIAL_MOVEMENTS, INITIAL_WORKSITES } from './data/initialData';
import { INITIAL_USERS } from './data/initialUsers';

const LOCAL_STORAGE_KEY_USERS = 'hogar_users_v1';
const LOCAL_STORAGE_KEY_CURRENT_USER = 'hogar_current_user_v1';

// Helper functions for per-user isolated storage
const getMaterialsKey = (userId: string) => `hogar_materials_user_${userId}`;
const getWorksitesKey = (userId: string) => `hogar_worksites_user_${userId}`;
const getMovementsKey = (userId: string) => `hogar_movements_user_${userId}`;

const loadUserMaterials = (userId: string): MaterialItem[] => {
  const saved = localStorage.getItem(getMaterialsKey(userId));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Error parsing materials for user', userId, e);
    }
  }
  const legacy = localStorage.getItem('estoque_civil_materials_v1');
  if (legacy && userId === INITIAL_USERS[0]?.id) {
    try {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return INITIAL_MATERIALS;
};

const loadUserWorksites = (userId: string): WorkSite[] => {
  const saved = localStorage.getItem(getWorksitesKey(userId));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Error parsing worksites for user', userId, e);
    }
  }
  const legacy = localStorage.getItem('estoque_civil_worksites_v1');
  if (legacy && userId === INITIAL_USERS[0]?.id) {
    try {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return INITIAL_WORKSITES;
};

const loadUserMovements = (userId: string): StockMovement[] => {
  const saved = localStorage.getItem(getMovementsKey(userId));
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error('Error parsing movements for user', userId, e);
    }
  }
  const legacy = localStorage.getItem('estoque_civil_movements_v1');
  if (legacy && userId === INITIAL_USERS[0]?.id) {
    try {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return INITIAL_MOVEMENTS;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'materials' | 'movements' | 'worksites' | 'ai' | 'analytics'>('materials');

  // Load registered users from localStorage or default
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_USERS) || localStorage.getItem('estoque_civil_users_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse users from localStorage', e);
      }
    }
    return INITIAL_USERS;
  });

  // Force login screen first when accessing the link
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const activeUserId = currentUser?.id || 'guest';

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Per-user isolated datasets
  const [materials, setMaterials] = useState<MaterialItem[]>(() => loadUserMaterials(activeUserId));
  const [movements, setMovements] = useState<StockMovement[]>(() => loadUserMovements(activeUserId));
  const [worksites, setWorksites] = useState<WorkSite[]>(() => loadUserWorksites(activeUserId));

  // Modals state
  const [isQuickMovementOpen, setIsQuickMovementOpen] = useState(false);
  const [preSelectedMaterialId, setPreSelectedMaterialId] = useState<string | undefined>(undefined);

  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<MaterialItem | null>(null);

  const [isWorksiteFormOpen, setIsWorksiteFormOpen] = useState(false);
  const [worksiteToEdit, setWorksiteToEdit] = useState<WorkSite | null>(null);

  const [isEditMovementOpen, setIsEditMovementOpen] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<StockMovement | null>(null);

  // Sync users to LocalStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
  }, [users]);

  // Sync active user & switch dataset when active user changes
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      // Reload user specific data
      setMaterials(loadUserMaterials(currentUser.id));
      setWorksites(loadUserWorksites(currentUser.id));
      setMovements(loadUserMovements(currentUser.id));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser?.id]);

  // Sync user isolated datasets to LocalStorage
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(getMaterialsKey(currentUser.id), JSON.stringify(materials));
    }
  }, [materials, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(getMovementsKey(currentUser.id), JSON.stringify(movements));
    }
  }, [movements, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(getWorksitesKey(currentUser.id), JSON.stringify(worksites));
    }
  }, [worksites, currentUser?.id]);

  // Auth actions
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleRegisterUser = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));

    // Clean up storage
    localStorage.removeItem(getMaterialsKey(userId));
    localStorage.removeItem(getWorksitesKey(userId));
    localStorage.removeItem(getMovementsKey(userId));

    if (currentUser?.id === userId) {
      const remainingUsers = users.filter((u) => u.id !== userId);
      if (remainingUsers.length > 0) {
        setCurrentUser(remainingUsers[0]);
      } else {
        setCurrentUser(null);
        setIsAuthModalOpen(true);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };


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

  // Edit Movement Modal Trigger
  const handleOpenEditMovement = (movement: StockMovement) => {
    setMovementToEdit(movement);
    setIsEditMovementOpen(true);
  };

  // Save (update) Movement
  const handleSaveMovement = (id: string, updatedData: Partial<StockMovement>) => {
    const oldMovement = movements.find((m) => m.id === id);
    if (!oldMovement) return;

    // First reverse old movement stock effect on material
    setMaterials((prev) =>
      prev.map((mat) => {
        if (mat.id === oldMovement.materialId) {
          let restoredQty = mat.quantity;
          if (oldMovement.type === 'ENTRADA' || oldMovement.type === 'DEVOLUCAO') {
            restoredQty = Math.max(0, restoredQty - oldMovement.quantity);
          } else if (oldMovement.type === 'SAIDA' || oldMovement.type === 'AJUSTE') {
            restoredQty += oldMovement.quantity;
          }

          // Apply new movement stock effect
          const newType = updatedData.type || oldMovement.type;
          const newQty = updatedData.quantity !== undefined ? updatedData.quantity : oldMovement.quantity;

          if (newType === 'ENTRADA' || newType === 'DEVOLUCAO') {
            restoredQty += newQty;
          } else if (newType === 'SAIDA' || newType === 'AJUSTE') {
            restoredQty = Math.max(0, restoredQty - newQty);
          }

          return {
            ...mat,
            quantity: restoredQty,
            lastUpdated: new Date().toISOString().slice(0, 10),
          };
        }
        return mat;
      })
    );

    // Update movement record
    setMovements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedData } : m))
    );
  };

  // Delete Movement
  const handleDeleteMovement = (id: string) => {
    const movToDelete = movements.find((m) => m.id === id);
    if (movToDelete) {
      // Reverse stock effect on material
      setMaterials((prev) =>
        prev.map((mat) => {
          if (mat.id === movToDelete.materialId) {
            let adjustedQty = mat.quantity;
            if (movToDelete.type === 'ENTRADA' || movToDelete.type === 'DEVOLUCAO') {
              adjustedQty = Math.max(0, adjustedQty - movToDelete.quantity);
            } else if (movToDelete.type === 'SAIDA' || movToDelete.type === 'AJUSTE') {
              adjustedQty += movToDelete.quantity;
            }
            return {
              ...mat,
              quantity: adjustedQty,
              lastUpdated: new Date().toISOString().slice(0, 10),
            };
          }
          return mat;
        })
      );
    }

    setMovements((prev) => prev.filter((m) => m.id !== id));
  };

  // Save (Create or Edit) Worksite
  const handleSaveWorksite = (
    worksiteData: Omit<WorkSite, 'id' | 'totalSpentMaterials'>,
    id?: string
  ) => {
    if (id) {
      setWorksites((prev) =>
        prev.map((w) => (w.id === id ? { ...w, ...worksiteData } : w))
      );
    } else {
      const newWorksite: WorkSite = {
        ...worksiteData,
        id: `obra-${Date.now()}`,
        totalSpentMaterials: 0,
      };
      setWorksites((prev) => [newWorksite, ...prev]);
    }
  };

  // Delete Worksite
  const handleDeleteWorksite = (id: string) => {
    setWorksites((prev) => prev.filter((w) => w.id !== id));
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
        currentUser={currentUser}
        users={users}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onDeleteUser={handleDeleteUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'materials' && (
          <MaterialsView
            materials={materials}
            worksites={worksites}
            currentUser={currentUser}
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
            currentUser={currentUser}
            onOpenNewMovement={() => handleOpenQuickMovement()}
            onEditMovement={handleOpenEditMovement}
            onDeleteMovement={handleDeleteMovement}
          />
        )}

        {activeTab === 'worksites' && (
          <WorksitesView
            worksites={worksites}
            movements={movements}
            currentUser={currentUser}
            onOpenNewWorksite={() => {
              setWorksiteToEdit(null);
              setIsWorksiteFormOpen(true);
            }}
            onEditWorksite={(site) => {
              setWorksiteToEdit(site);
              setIsWorksiteFormOpen(true);
            }}
            onDeleteWorksite={handleDeleteWorksite}
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
        defaultResponsible={currentUser?.name || ''}
      />

      {/* Edit Movement Modal */}
      <EditMovementModal
        isOpen={isEditMovementOpen}
        onClose={() => setIsEditMovementOpen(false)}
        movement={movementToEdit}
        materials={materials}
        worksites={worksites}
        onSaveMovement={handleSaveMovement}
        onDeleteMovement={handleDeleteMovement}
      />

      {/* Create / Edit Material Modal */}
      <MaterialFormModal
        isOpen={isMaterialFormOpen}
        onClose={() => setIsMaterialFormOpen(false)}
        materialToEdit={materialToEdit}
        onSaveMaterial={handleSaveMaterial}
      />

      {/* Create / Edit Worksite Modal */}
      <WorksiteFormModal
        isOpen={isWorksiteFormOpen}
        onClose={() => setIsWorksiteFormOpen(false)}
        worksiteToEdit={worksiteToEdit}
        onSaveWorksite={handleSaveWorksite}
        onDeleteWorksite={handleDeleteWorksite}
      />

      {/* Auth / Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen || !currentUser}
        onClose={() => setIsAuthModalOpen(false)}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleRegisterUser}
        onDeleteUser={handleDeleteUser}
        isGateMode={!currentUser}
      />


      {/* Footer */}
      <footer className="bg-[#0F0F11] border-t border-[#1F1F21] text-[#888888] py-6 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Hogar Empreendimentos — Gestão de Materiais e Almoxarifado de Obras</p>
          <div className="flex items-center gap-4 text-[#888888]">
            <span>NBR/ABNT Compliant</span>
            <span>•</span>
            <span>Canteiros de Obras Integrados</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
