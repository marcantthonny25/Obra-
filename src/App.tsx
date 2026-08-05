import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { MaterialsView } from './components/MaterialsView';
import { MovementsView } from './components/MovementsView';
import { WorksitesView } from './components/WorksitesView';
import { AIAssistantView } from './components/AIAssistantView';
import { AnalyticsView } from './components/AnalyticsView';
import { UsersManagementView } from './components/UsersManagementView';
import { FirstAccessPasswordModal } from './components/FirstAccessPasswordModal';
import { QuickMovementModal } from './components/QuickMovementModal';
import { MaterialFormModal } from './components/MaterialFormModal';
import { WorksiteFormModal } from './components/WorksiteFormModal';
import { EditMovementModal } from './components/EditMovementModal';
import { AuthModal } from './components/AuthModal';
import { MaterialItem, StockMovement, WorkSite, User, isWorksiteLockedRole, canManageWorksites } from './types';
import { INITIAL_MATERIALS, INITIAL_MOVEMENTS, INITIAL_WORKSITES } from './data/initialData';
import { INITIAL_USERS } from './data/initialUsers';

const LOCAL_STORAGE_KEY_CURRENT_USER = 'hogar_current_user_v2';

const stripUndefined = <T extends Record<string, any>>(obj: T): T => {
  const cleaned: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned as T;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'materials' | 'movements' | 'worksites' | 'ai' | 'analytics' | 'users'>('home');

  // Real-time synced Firestore state
  const [users, setUsers] = useState<User[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [worksites, setWorksites] = useState<WorkSite[]>([]);

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse currentUser from localStorage', e);
      }
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [selectedWorksiteId, setSelectedWorksiteId] = useState<string>('ALL');

  // Modals state
  const [isQuickMovementOpen, setIsQuickMovementOpen] = useState(false);
  const [preSelectedMaterialId, setPreSelectedMaterialId] = useState<string | undefined>(undefined);

  const [isMaterialFormOpen, setIsMaterialFormOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<MaterialItem | null>(null);

  const [isWorksiteFormOpen, setIsWorksiteFormOpen] = useState(false);
  const [worksiteToEdit, setWorksiteToEdit] = useState<WorkSite | null>(null);

  const [isEditMovementOpen, setIsEditMovementOpen] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<StockMovement | null>(null);

  // Auto-set & Lock Worksite upon login for Almoxarife / Mestre de Obras
  useEffect(() => {
    if (currentUser && isWorksiteLockedRole(currentUser.role)) {
      if (worksites.length > 0) {
        const matched = worksites.find(
          (w) =>
            w.id === currentUser.worksiteId ||
            w.name.toLowerCase() === currentUser.worksiteAssigned?.toLowerCase()
        );
        if (matched) {
          setSelectedWorksiteId(matched.id);
        } else if (worksites[0]) {
          setSelectedWorksiteId(worksites[0].id);
        }
      }
    }
  }, [currentUser, worksites]);

  // Firestore Real-Time Listeners (Manual creation only, no auto-seeding)
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const fetchedUsers = snapshot.docs.map((docSnap) => docSnap.data() as User);
      setUsers(fetchedUsers);
    });

    const unsubscribeMaterials = onSnapshot(collection(db, 'materials'), (snapshot) => {
      const fetchedMaterials = snapshot.docs.map((docSnap) => docSnap.data() as MaterialItem);
      setMaterials(fetchedMaterials);
    });

    const unsubscribeMovements = onSnapshot(collection(db, 'movements'), (snapshot) => {
      const fetchedMovements = snapshot.docs.map((docSnap) => docSnap.data() as StockMovement);
      // Sort movements newest first
      fetchedMovements.sort((a, b) => b.id.localeCompare(a.id));
      setMovements(fetchedMovements);
    });

    const unsubscribeWorksites = onSnapshot(collection(db, 'worksites'), (snapshot) => {
      const fetchedWorksites = snapshot.docs.map((docSnap) => docSnap.data() as WorkSite);
      setWorksites(fetchedWorksites);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeMaterials();
      unsubscribeMovements();
      unsubscribeWorksites();
    };
  }, []);

  // Manual trigger to load demo data (Administrator only)
  const handleSeedDemoData = async () => {
    if (!currentUser || (currentUser.role !== 'Administrador' && currentUser.role?.toLowerCase() !== 'admin')) {
      alert('Somente o Administrador pode executar essa ação.');
      return;
    }
    if (confirm('Deseja carregar os dados de demonstração (usuários, insumos, movimentações e obras) no Firestore?')) {
      try {
        for (const u of INITIAL_USERS) {
          await setDoc(doc(db, 'users', u.id), u);
        }
        for (const m of INITIAL_MATERIALS) {
          await setDoc(doc(db, 'materials', m.id), m);
        }
        for (const mov of INITIAL_MOVEMENTS) {
          await setDoc(doc(db, 'movements', mov.id), mov);
        }
        for (const w of INITIAL_WORKSITES) {
          await setDoc(doc(db, 'worksites', w.id), w);
        }
        alert('Dados de demonstração carregados com sucesso no Firestore!');
      } catch (err) {
        console.error('Erro ao popular dados de demonstração:', err);
        alert('Erro ao popular dados de demonstração no Firestore.');
      }
    }
  };

  // Save current user to localStorage for browser session survival
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    }
  }, [currentUser]);

  // Auth actions
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  const handleRegisterUser = async (newUser: User) => {
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (err) {
      console.error('Error saving new user to Firestore:', err);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      await setDoc(doc(db, 'users', updatedUser.id), updatedUser);
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
      }
    } catch (err) {
      console.error('Error updating user in Firestore:', err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      if (currentUser?.id === userId) {
        setCurrentUser(null);
        setIsAuthModalOpen(true);
      }
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
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

  // Add a Stock Movement (Atomic runTransaction in Firestore)
  const handleAddMovement = async (
    movementData: Omit<StockMovement, 'id' | 'date'>,
    updatedUnitPrice?: number
  ) => {
    const movId = `mov-${Date.now()}`;
    const newMovement: StockMovement = stripUndefined({
      ...movementData,
      id: movId,
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    });

    const materialRef = doc(db, 'materials', movementData.materialId);
    const movementRef = doc(db, 'movements', movId);
    const worksiteRef = (movementData.type === 'SAIDA' && movementData.workSiteId) 
      ? doc(db, 'worksites', movementData.workSiteId) 
      : null;

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Read Material doc inside transaction to ensure fresh & atomic data
        const matSnap = await transaction.get(materialRef);
        if (!matSnap.exists()) {
          throw new Error(`Insumo (ID: ${movementData.materialId}) não encontrado no banco de dados.`);
        }

        const matData = matSnap.data() as MaterialItem;
        const currentQty = matData.quantity || 0;

        // 2. Prevent negative stock balance on exit/adjustment movements
        if ((movementData.type === 'SAIDA' || movementData.type === 'AJUSTE') && movementData.quantity > currentQty) {
          throw new Error(
            `Saldo insuficiente em estoque no Firestore! Saldo atual: ${currentQty} ${matData.unit || ''}. Quantidade solicitada: ${movementData.quantity}.`
          );
        }

        // 3. Calculate new stock balance
        let newQty = currentQty;
        if (movementData.type === 'ENTRADA' || movementData.type === 'DEVOLUCAO') {
          newQty += movementData.quantity;
        } else if (movementData.type === 'SAIDA' || movementData.type === 'AJUSTE') {
          newQty -= movementData.quantity;
        }

        const finalPrice = updatedUnitPrice !== undefined ? updatedUnitPrice : (matData.avgUnitPrice || 0);

        // 4. Read Worksite doc inside transaction if applicable
        let worksiteSnap = null;
        if (worksiteRef) {
          worksiteSnap = await transaction.get(worksiteRef);
        }

        // 5. Commit atomic writes
        transaction.set(movementRef, newMovement);
        transaction.update(materialRef, {
          quantity: Math.max(0, newQty),
          avgUnitPrice: finalPrice,
          lastUpdated: new Date().toISOString().slice(0, 10),
        });

        if (worksiteRef && worksiteSnap && worksiteSnap.exists()) {
          const currentSpent = worksiteSnap.data().totalSpentMaterials || 0;
          transaction.update(worksiteRef, {
            totalSpentMaterials: currentSpent + (movementData.totalPrice || 0),
          });
        }
      });
      console.log(`[Firestore] Movimentação ${movId} gravada com sucesso em transação atômica.`);
    } catch (err) {
      console.error('[Firestore Error] Erro ao gravar movimentação em transação:', err);
      throw err;
    }
  };

  // Create or Edit Material Item (sync to Firestore)
  const handleSaveMaterial = async (
    materialData: Omit<MaterialItem, 'id' | 'lastUpdated'>,
    id?: string
  ) => {
    const matId = id || `mat-${Date.now()}`;
    const materialToSave: MaterialItem = stripUndefined({
      ...materialData,
      id: matId,
      lastUpdated: new Date().toISOString().slice(0, 10),
    });
    try {
      await setDoc(doc(db, 'materials', matId), materialToSave);
      console.log(`[Firestore] Insumo ${matId} salvo com sucesso no Firestore.`);
    } catch (err) {
      console.error('[Firestore Error] Erro ao salvar insumo no Firestore:', err);
      throw err;
    }
  };

  // Delete Material from Firestore
  const handleDeleteMaterial = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este insumo do catálogo?')) {
      try {
        await deleteDoc(doc(db, 'materials', id));
        console.log(`[Firestore] Insumo ${id} excluído com sucesso.`);
      } catch (err) {
        console.error('[Firestore Error] Erro ao excluir insumo:', err);
        alert('Erro ao excluir insumo do Firestore.');
      }
    }
  };

  // Edit Movement Modal Trigger
  const handleOpenEditMovement = (movement: StockMovement) => {
    setMovementToEdit(movement);
    setIsEditMovementOpen(true);
  };

  // Save (update) Movement in Firestore (Atomic Transaction)
  const handleSaveMovement = async (id: string, updatedData: Partial<StockMovement>) => {
    const oldMovement = movements.find((m) => m.id === id);
    if (!oldMovement) throw new Error('Movimentação original não encontrada.');

    const movementRef = doc(db, 'movements', id);
    const materialRef = doc(db, 'materials', oldMovement.materialId);

    try {
      await runTransaction(db, async (transaction) => {
        const matSnap = await transaction.get(materialRef);
        if (!matSnap.exists()) {
          throw new Error('Insumo correspondente não encontrado no Firestore.');
        }
        const matData = matSnap.data() as MaterialItem;
        let restoredQty = matData.quantity || 0;

        // Revert old movement effect
        if (oldMovement.type === 'ENTRADA' || oldMovement.type === 'DEVOLUCAO') {
          restoredQty -= oldMovement.quantity;
        } else if (oldMovement.type === 'SAIDA' || oldMovement.type === 'AJUSTE') {
          restoredQty += oldMovement.quantity;
        }

        const newType = updatedData.type || oldMovement.type;
        const newQty = updatedData.quantity !== undefined ? updatedData.quantity : oldMovement.quantity;

        // Prevent negative balance
        if ((newType === 'SAIDA' || newType === 'AJUSTE') && newQty > restoredQty) {
          throw new Error(
            `Saldo insuficiente em estoque no Firestore! Saldo restaurado: ${restoredQty}. Tentativa de saída: ${newQty}.`
          );
        }

        if (newType === 'ENTRADA' || newType === 'DEVOLUCAO') {
          restoredQty += newQty;
        } else if (newType === 'SAIDA' || newType === 'AJUSTE') {
          restoredQty -= newQty;
        }

        const updatedMov: StockMovement = stripUndefined({ ...oldMovement, ...updatedData });

        transaction.update(materialRef, {
          quantity: Math.max(0, restoredQty),
          lastUpdated: new Date().toISOString().slice(0, 10),
        });
        transaction.set(movementRef, updatedMov);
      });
      console.log(`[Firestore] Movimentação ${id} atualizada com sucesso em transação.`);
    } catch (err) {
      console.error('[Firestore Error] Erro ao atualizar movimentação:', err);
      throw err;
    }
  };

  // Delete Movement from Firestore (Atomic Transaction)
  const handleDeleteMovement = async (id: string) => {
    const movToDelete = movements.find((m) => m.id === id);
    if (!movToDelete) return;

    const movementRef = doc(db, 'movements', id);
    const materialRef = doc(db, 'materials', movToDelete.materialId);

    try {
      await runTransaction(db, async (transaction) => {
        const matSnap = await transaction.get(materialRef);
        if (matSnap.exists()) {
          const matData = matSnap.data() as MaterialItem;
          let adjustedQty = matData.quantity || 0;
          if (movToDelete.type === 'ENTRADA' || movToDelete.type === 'DEVOLUCAO') {
            adjustedQty = Math.max(0, adjustedQty - movToDelete.quantity);
          } else if (movToDelete.type === 'SAIDA' || movToDelete.type === 'AJUSTE') {
            adjustedQty += movToDelete.quantity;
          }
          transaction.update(materialRef, {
            quantity: adjustedQty,
            lastUpdated: new Date().toISOString().slice(0, 10),
          });
        }
        transaction.delete(movementRef);
      });
      console.log(`[Firestore] Movimentação ${id} excluída com sucesso.`);
    } catch (err) {
      console.error('[Firestore Error] Erro ao excluir movimentação:', err);
      throw err;
    }
  };

  // Save (Create or Edit) Worksite in Firestore
  const handleSaveWorksite = async (
    worksiteData: Omit<WorkSite, 'id' | 'totalSpentMaterials'>,
    id?: string
  ) => {
    const siteId = id || `obra-${Date.now()}`;
    const existingSite = worksites.find((w) => w.id === siteId);
    const siteToSave: WorkSite = {
      ...worksiteData,
      id: siteId,
      totalSpentMaterials: existingSite ? existingSite.totalSpentMaterials : 0,
    };
    await setDoc(doc(db, 'worksites', siteId), siteToSave);
  };

  // Delete Worksite from Firestore
  const handleDeleteWorksite = async (id: string) => {
    await deleteDoc(doc(db, 'worksites', id));
  };

  // Batch Add Materials from AI Estimator
  const handleBatchAddMaterials = async (items: Omit<MaterialItem, 'id' | 'lastUpdated'>[]) => {
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const matId = `mat-ai-${Date.now()}-${idx}`;
      const newMat: MaterialItem = {
        ...item,
        id: matId,
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
      await setDoc(doc(db, 'materials', matId), newMat);
    }
  };

  // Batch Stock In from AI Invoice Parser
  const handleBatchStockIn = async (
    items: { name: string; quantity: number; unitPrice?: number; category: any; unit: string }[]
  ) => {
    const today = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      let mat = materials.find((m) => m.name.toLowerCase() === item.name.toLowerCase());
      let matId = mat?.id;

      if (!mat) {
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
        await setDoc(doc(db, 'materials', matId), newMat);
      } else {
        const updatedMat: MaterialItem = {
          ...mat,
          quantity: mat.quantity + item.quantity,
          avgUnitPrice: item.unitPrice ? item.unitPrice : mat.avgUnitPrice,
        };
        await setDoc(doc(db, 'materials', matId), updatedMat);
      }

      const newMov: StockMovement = {
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
      };
      await setDoc(doc(db, 'movements', newMov.id), newMov);
    }
  };

  // Import Backup JSON
  const handleImportBackupJSON = async (data: {
    materials: MaterialItem[];
    movements: StockMovement[];
    worksites: WorkSite[];
  }) => {
    for (const mat of data.materials) {
      await setDoc(doc(db, 'materials', mat.id), mat);
    }
    for (const mov of data.movements) {
      await setDoc(doc(db, 'movements', mov.id), mov);
    }
    for (const site of data.worksites) {
      await setDoc(doc(db, 'worksites', site.id), site);
    }
  };

  // Unauthenticated Guard: Render ONLY full-screen Login view without any background dashboard, navbar, or footer
  if (!currentUser) {
    return (
      <AuthModal
        isOpen={true}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleRegisterUser}
        onDeleteUser={handleDeleteUser}
        isGateMode={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] font-sans text-[#E0E0E0] flex flex-col antialiased selection:bg-[#F2A30F] selection:text-black">
      {/* Navigation Top Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        materials={materials}
        worksites={worksites}
        selectedWorksiteId={selectedWorksiteId}
        onSelectWorksite={(id) => setSelectedWorksiteId(id)}
        onOpenNewMovement={() => handleOpenQuickMovement()}
        currentUser={currentUser}
        users={users}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onDeleteUser={handleDeleteUser}
      />

      {/* Main Content Area */}
      {activeTab === 'home' ? (
        <main className="flex-1 w-full p-0 m-0">
          <HomePage
            onNavigate={setActiveTab}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            materials={materials}
            movements={movements}
            worksites={worksites}
            onOpenQuickMovement={handleOpenQuickMovement}
          />
        </main>
      ) : (
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
            currentUser={currentUser}
            onImportBackupJSON={handleImportBackupJSON}
            onSeedDemoData={handleSeedDemoData}
          />
        )}

        {activeTab === 'users' && (
          <UsersManagementView
            users={users}
            worksites={worksites}
            currentUser={currentUser}
            onRegisterUser={handleRegisterUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onSeedDemoData={handleSeedDemoData}
          />
        )}
        </main>
      )}

      {/* Mandatory First Access Password Change Modal */}
      {currentUser && currentUser.mustChangePassword && (
        <FirstAccessPasswordModal
          user={currentUser}
          onPasswordChanged={(newPassword) => {
            const updated = {
              ...currentUser,
              password: newPassword,
              mustChangePassword: false,
            };
            handleUpdateUser(updated);
          }}
        />
      )}

      {/* Quick Movement Modal */}
      <QuickMovementModal
        isOpen={isQuickMovementOpen}
        onClose={() => setIsQuickMovementOpen(false)}
        materials={materials}
        worksites={worksites}
        preSelectedMaterialId={preSelectedMaterialId}
        onAddMovement={handleAddMovement}
        defaultResponsible={currentUser?.name || ''}
        currentUser={currentUser}
        selectedWorksiteId={selectedWorksiteId}
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
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          users={users}
          onLoginSuccess={handleLoginSuccess}
          onRegisterUser={handleRegisterUser}
          onDeleteUser={handleDeleteUser}
          isGateMode={false}
        />
      )}


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
