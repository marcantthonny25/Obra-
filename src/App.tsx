import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db, sanitizeForFirestore, assertNoUndefined } from './lib/firebase';
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
import { CsvImportModal } from './components/CsvImportModal';
import { GlobalCatalogItemEditModal } from './components/GlobalCatalogItemEditModal';
import { CatalogAuditHistoryModal } from './components/CatalogAuditHistoryModal';
import { InitialStockSetupModal } from './components/InitialStockSetupModal';
import { parseCsvText, buildImportPreviewSummary, executeBatchImport } from './lib/csvCatalogManager';
import { MaterialItem, StockMovement, WorkSite, User, CatalogoInsumo, EstoqueCanteiro, HistoricoAlteracaoInsumo, isWorksiteLockedRole, canManageWorksites, canCreateOrEditMovements } from './types';
import { INITIAL_MATERIALS, INITIAL_MOVEMENTS, INITIAL_WORKSITES } from './data/initialData';
import { INITIAL_USERS } from './data/initialUsers';

const LOCAL_STORAGE_KEY_CURRENT_USER = 'hogar_current_user_v2';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'materials' | 'movements' | 'worksites' | 'ai' | 'analytics' | 'users'>('home');

  // Real-time synced Firestore state
  const [users, setUsers] = useState<User[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [worksites, setWorksites] = useState<WorkSite[]>([]);
  const [catalogoInsumos, setCatalogoInsumos] = useState<CatalogoInsumo[]>([]);
  const [estoquesPorCanteiro, setEstoquesPorCanteiro] = useState<EstoqueCanteiro[]>([]);
  const [historicoLogs, setHistoricoLogs] = useState<HistoricoAlteracaoInsumo[]>([]);

  // Modal States for Global Catalog
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isGlobalEditOpen, setIsGlobalEditOpen] = useState(false);
  const [selectedInsumoForEdit, setSelectedInsumoForEdit] = useState<CatalogoInsumo | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedInsumoForHistory, setSelectedInsumoForHistory] = useState<CatalogoInsumo | null>(null);

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

    let isSeedingCatalog = false;

    const unsubscribeCatalog = onSnapshot(collection(db, 'catalogoInsumos'), async (snapshot) => {
      const fetchedCatalog = snapshot.docs.map((docSnap) => docSnap.data() as CatalogoInsumo);
      setCatalogoInsumos(fetchedCatalog);

      if (snapshot.empty && !isSeedingCatalog) {
        isSeedingCatalog = true;
        console.log('[AutoSeed Catalog] Coleção catalogoInsumos vazia no Firestore. Iniciando importação do CSV oficial...');
        try {
          const res = await fetch('/importacao_sugerida_insumos_hogar.csv');
          if (res.ok) {
            const csvText = await res.text();
            const rows = parseCsvText(csvText);
            const summary = buildImportPreviewSummary(rows, []);
            await executeBatchImport(
              summary,
              { updateDuplicates: true },
              {
                id: 'admin_sys',
                name: 'Administrador Sistema',
                role: 'Administrador',
                email: 'admin@hogar.com.br',
                createdAt: new Date().toISOString(),
              }
            );
            console.log(`[AutoSeed Catalog] Concluído! ${rows.length} insumos semeados na coleção catalogoInsumos do Firestore.`);
          }
        } catch (err) {
          console.error('[AutoSeed Catalog] Erro ao semear catálogo:', err);
        }
      }
    });

    const unsubscribeStocks = onSnapshot(collection(db, 'estoquesPorCanteiro'), (snapshot) => {
      const fetchedStocks = snapshot.docs.map((docSnap) => docSnap.data() as EstoqueCanteiro);
      setEstoquesPorCanteiro(fetchedStocks);
    });

    const unsubscribeLogs = onSnapshot(collection(db, 'historicoAlteracoesInsumos'), (snapshot) => {
      const fetchedLogs = snapshot.docs.map((docSnap) => docSnap.data() as HistoricoAlteracaoInsumo);
      setHistoricoLogs(fetchedLogs);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeMaterials();
      unsubscribeMovements();
      unsubscribeWorksites();
      unsubscribeCatalog();
      unsubscribeStocks();
      unsubscribeLogs();
    };
  }, []);

  // Unified materials combining Global Catalog + Canteiro Specific Stocks
  const unifiedMaterials: MaterialItem[] = React.useMemo(() => {
    if (catalogoInsumos.length === 0) {
      return materials;
    }

    const stockMap = new Map<string, EstoqueCanteiro>();
    estoquesPorCanteiro.forEach((st) => {
      stockMap.set(st.id, st);
      stockMap.set(`${st.canteiroId}_${st.insumoId}`, st);
    });

    return catalogoInsumos.map((insumo) => {
      let stockForCanteiro: EstoqueCanteiro | undefined = undefined;

      if (selectedWorksiteId && selectedWorksiteId !== 'ALL') {
        stockForCanteiro = stockMap.get(`${selectedWorksiteId}_${insumo.id}`);
      }

      let qty = 0;
      let minQty = 10;
      let locationStr = 'Não configurado';

      if (selectedWorksiteId === 'ALL') {
        const canteiroStocks = estoquesPorCanteiro.filter((st) => st.insumoId === insumo.id);
        qty = canteiroStocks.reduce((sum, s) => sum + (s.estoqueAtual || 0), 0);
        locationStr = canteiroStocks.length > 0 ? `${canteiroStocks.length} canteiro(s)` : 'Visão Global';
      } else if (stockForCanteiro) {
        qty = stockForCanteiro.estoqueAtual || 0;
        minQty = stockForCanteiro.estoqueMinimo !== undefined ? stockForCanteiro.estoqueMinimo : 10;
        locationStr = stockForCanteiro.localArmazenamento || 'Almoxarifado Principal';
      }

      return {
        id: insumo.id,
        code: insumo.codigoExterno || insumo.id,
        name: insumo.nome,
        category: insumo.categoria,
        quantity: qty,
        minQuantity: minQty,
        unit: insumo.unidade || 'un',
        avgUnitPrice: insumo.precoUnitario || 0,
        location: locationStr,
        supplier: insumo.subcategoria || '',
        lastUpdated: insumo.atualizadoEm || new Date().toISOString().slice(0, 10),
        notes: insumo.observacoes,
        paginaFonte: insumo.paginaFonte,
        detalhesAdicionais: insumo.detalhesAdicionais,
        ativo: insumo.ativo,
      };
    });
  }, [catalogoInsumos, estoquesPorCanteiro, selectedWorksiteId, materials]);

  // Handle Global Edit Material Save
  const handleSaveGlobalInsumo = async (updatedInsumo: CatalogoInsumo) => {
    try {
      const insumoRef = doc(db, 'catalogoInsumos', updatedInsumo.id);
      const cleanData = sanitizeForFirestore(updatedInsumo);
      assertNoUndefined(cleanData);
      await setDoc(insumoRef, cleanData);

      // Record Audit Log in historicoAlteracoesInsumos
      const logId = `log-${Date.now()}`;
      const logObj: HistoricoAlteracaoInsumo = {
        id: logId,
        insumoId: updatedInsumo.id,
        insumoCodigoExterno: updatedInsumo.codigoExterno,
        usuarioId: currentUser?.id || 'sys',
        usuarioNome: currentUser?.name || 'Administrador',
        dataHora: new Date().toISOString(),
        tipoAlteracao: 'EDICAO_GLOBAL',
        campoAlterado: 'Insumo Editado Globalmente',
        informacaoNova: `${updatedInsumo.nome} | R$ ${updatedInsumo.precoUnitario} | ${updatedInsumo.unidade}`,
      };
      const cleanLog = sanitizeForFirestore(logObj);
      assertNoUndefined(cleanLog);
      await setDoc(doc(db, 'historicoAlteracoesInsumos', logId), cleanLog);

      console.log(`[Firestore] Insumo ${updatedInsumo.id} atualizado no Catálogo Global com histórico.`);
    } catch (err) {
      console.error('Erro ao salvar insumo global:', err);
      throw err;
    }
  };

  // Manual trigger to load demo data (Administrator only)
  const handleSeedDemoData = async () => {
    if (!currentUser || (currentUser.role !== 'Administrador' && currentUser.role?.toLowerCase() !== 'admin')) {
      alert('Somente o Administrador pode executar essa ação.');
      return;
    }
    if (confirm('Deseja carregar os dados de demonstração (usuários, insumos, movimentações e obras) no Firestore?')) {
      try {
        for (const u of INITIAL_USERS) {
          const clean = sanitizeForFirestore(u);
          assertNoUndefined(clean);
          await setDoc(doc(db, 'users', u.id), clean);
        }
        for (const m of INITIAL_MATERIALS) {
          const clean = sanitizeForFirestore(m);
          assertNoUndefined(clean);
          await setDoc(doc(db, 'materials', m.id), clean);
        }
        for (const mov of INITIAL_MOVEMENTS) {
          const clean = sanitizeForFirestore(mov);
          assertNoUndefined(clean);
          await setDoc(doc(db, 'movements', mov.id), clean);
        }
        for (const w of INITIAL_WORKSITES) {
          const clean = sanitizeForFirestore(w);
          assertNoUndefined(clean);
          await setDoc(doc(db, 'worksites', w.id), clean);
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
      const cleanUser = sanitizeForFirestore(newUser);
      assertNoUndefined(cleanUser);
      await setDoc(doc(db, 'users', newUser.id), cleanUser);
    } catch (err) {
      console.error('Error saving new user to Firestore:', err);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const cleanUser = sanitizeForFirestore(updatedUser);
      assertNoUndefined(cleanUser);
      await setDoc(doc(db, 'users', updatedUser.id), cleanUser);
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
    if (currentUser && !canCreateOrEditMovements(currentUser.role)) {
      throw new Error('Acesso negado: Perfis de Coordenador e Engenheiro são estritamente somente-leitura. Não podem criar movimentações.');
    }

    if (currentUser && isWorksiteLockedRole(currentUser.role)) {
      const assignedId = currentUser.worksiteId;
      const assignedName = currentUser.worksiteAssigned?.toLowerCase();
      const worksiteMatch =
        (assignedId && movementData.workSiteId === assignedId) ||
        (assignedName && movementData.workSiteName?.toLowerCase() === assignedName);
      if (!worksiteMatch && (assignedId || assignedName)) {
        throw new Error('Permissão negada: Almoxarife só pode lançar movimentações na obra vinculada ao seu perfil.');
      }
    }

    const movId = `mov-${Date.now()}`;
    const rawMovement: StockMovement = {
      ...movementData,
      id: movId,
      date: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
    };
    const newMovement = sanitizeForFirestore(rawMovement);
    assertNoUndefined(newMovement);

    const materialRef = doc(db, 'materials', movementData.materialId);
    const movementRef = doc(db, 'movements', movId);
    const worksiteRef = (movementData.type === 'SAIDA' && movementData.workSiteId) 
      ? doc(db, 'worksites', movementData.workSiteId) 
      : null;

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Read Material doc inside transaction to ensure fresh & atomic data
        const matSnap = await transaction.get(materialRef);
        let matData: Partial<MaterialItem> = {};
        let currentQty = 0;

        if (matSnap.exists()) {
          matData = matSnap.data() as MaterialItem;
          currentQty = matData.quantity || 0;
        } else {
          // If the item comes directly from catalogoInsumos and doesn't exist in materials collection yet
          const catalogMatch = catalogoInsumos.find(c => c.id === movementData.materialId || c.codigoExterno === movementData.materialId);
          matData = {
            id: movementData.materialId,
            code: catalogMatch?.codigoExterno || movementData.materialId,
            name: movementData.materialName || catalogMatch?.nome || 'Insumo Sem Nome',
            category: catalogMatch?.categoria || 'Geral',
            quantity: 0,
            minQuantity: 10,
            unit: movementData.unit || catalogMatch?.unidade || 'un',
            avgUnitPrice: catalogMatch?.precoEstimado || catalogMatch?.precoUnitario || movementData.unitPrice || 0,
            location: 'Catálogo Global',
            lastUpdated: new Date().toISOString().slice(0, 10),
          };
        }

        // 2. Prevent negative stock balance on exit/adjustment movements
        if ((movementData.type === 'SAIDA' || movementData.type === 'AJUSTE') && movementData.quantity > currentQty) {
          throw new Error(
            `Saldo insuficiente em estoque no Firestore! Saldo atual: ${currentQty} ${movementData.unit || matData.unit || ''}. Quantidade solicitada: ${movementData.quantity}.`
          );
        }

        // 3. Calculate new stock balance
        let newQty = currentQty;
        if (movementData.type === 'ENTRADA' || movementData.type === 'DEVOLUCAO') {
          newQty += movementData.quantity;
        } else if (movementData.type === 'SAIDA' || movementData.type === 'AJUSTE') {
          newQty -= movementData.quantity;
        }

        const finalPrice = updatedUnitPrice !== undefined ? updatedUnitPrice : (movementData.unitPrice || matData.avgUnitPrice || 0);

        // 4. Read Worksite doc inside transaction if applicable
        let worksiteSnap = null;
        if (worksiteRef) {
          worksiteSnap = await transaction.get(worksiteRef);
        }

        // 5. Commit atomic writes
        const matUpdate = sanitizeForFirestore({
          ...matData,
          quantity: Math.max(0, newQty),
          avgUnitPrice: finalPrice,
          lastUpdated: new Date().toISOString().slice(0, 10),
        });
        assertNoUndefined(matUpdate);

        transaction.set(movementRef, newMovement);
        if (matSnap.exists()) {
          transaction.update(materialRef, matUpdate);
        } else {
          transaction.set(materialRef, matUpdate);
        }

        if (worksiteRef && worksiteSnap && worksiteSnap.exists()) {
          const currentSpent = worksiteSnap.data().totalSpentMaterials || 0;
          const siteUpdate = sanitizeForFirestore({
            totalSpentMaterials: currentSpent + (movementData.totalPrice || 0),
          });
          assertNoUndefined(siteUpdate);
          transaction.update(worksiteRef, siteUpdate);
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
    const currentSite = worksites.find((w) => w.id === selectedWorksiteId);

    const rawMaterial: MaterialItem = {
      ...materialData,
      id: matId,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };

    if (selectedWorksiteId && selectedWorksiteId !== 'ALL') {
      if (!rawMaterial.workSiteId) rawMaterial.workSiteId = selectedWorksiteId;
      if (!rawMaterial.workSiteName && currentSite) rawMaterial.workSiteName = currentSite.name;
    }

    const materialToSave = sanitizeForFirestore(rawMaterial);
    assertNoUndefined(materialToSave);

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
    if (currentUser && !canCreateOrEditMovements(currentUser.role)) {
      throw new Error('Acesso negado: Perfis de Coordenador e Engenheiro são estritamente somente-leitura. Não podem editar movimentações.');
    }

    const oldMovement = movements.find((m) => m.id === id);
    if (!oldMovement) throw new Error('Movimentação original não encontrada.');

    if (currentUser && isWorksiteLockedRole(currentUser.role)) {
      const assignedId = currentUser.worksiteId;
      const assignedName = currentUser.worksiteAssigned?.toLowerCase();
      const worksiteMatch =
        (assignedId && oldMovement.workSiteId === assignedId) ||
        (assignedName && oldMovement.workSiteName?.toLowerCase() === assignedName);
      if (!worksiteMatch && (assignedId || assignedName)) {
        throw new Error('Permissão negada: Almoxarife só pode alterar movimentações da obra vinculada ao seu perfil.');
      }
    }

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

        const updatedMov = sanitizeForFirestore({ ...oldMovement, ...updatedData });
        assertNoUndefined(updatedMov);

        const matUpdate = sanitizeForFirestore({
          quantity: Math.max(0, restoredQty),
          lastUpdated: new Date().toISOString().slice(0, 10),
        });
        assertNoUndefined(matUpdate);

        transaction.update(materialRef, matUpdate);
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
    if (currentUser && !canCreateOrEditMovements(currentUser.role)) {
      throw new Error('Acesso negado: Perfis de Coordenador e Engenheiro são estritamente somente-leitura. Não podem excluir movimentações.');
    }

    const movToDelete = movements.find((m) => m.id === id);
    if (!movToDelete) return;

    if (currentUser && isWorksiteLockedRole(currentUser.role)) {
      const assignedId = currentUser.worksiteId;
      const assignedName = currentUser.worksiteAssigned?.toLowerCase();
      const worksiteMatch =
        (assignedId && movToDelete.workSiteId === assignedId) ||
        (assignedName && movToDelete.workSiteName?.toLowerCase() === assignedName);
      if (!worksiteMatch && (assignedId || assignedName)) {
        throw new Error('Permissão negada: Almoxarife só pode excluir movimentações da obra vinculada ao seu perfil.');
      }
    }

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
          const matUpdate = sanitizeForFirestore({
            quantity: adjustedQty,
            lastUpdated: new Date().toISOString().slice(0, 10),
          });
          assertNoUndefined(matUpdate);
          transaction.update(materialRef, matUpdate);
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
    const rawSite: WorkSite = {
      ...worksiteData,
      id: siteId,
      totalSpentMaterials: existingSite ? existingSite.totalSpentMaterials : 0,
    };
    const siteToSave = sanitizeForFirestore(rawSite);
    assertNoUndefined(siteToSave);
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
      const newMat = sanitizeForFirestore({
        ...item,
        id: matId,
        lastUpdated: new Date().toISOString().slice(0, 10),
      });
      assertNoUndefined(newMat);
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
        const newMat = sanitizeForFirestore({
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
        });
        assertNoUndefined(newMat);
        await setDoc(doc(db, 'materials', matId), newMat);
      } else {
        const updatedMat = sanitizeForFirestore({
          ...mat,
          quantity: mat.quantity + item.quantity,
          avgUnitPrice: item.unitPrice ? item.unitPrice : mat.avgUnitPrice,
        });
        assertNoUndefined(updatedMat);
        await setDoc(doc(db, 'materials', matId), updatedMat);
      }

      const newMov = sanitizeForFirestore({
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
      assertNoUndefined(newMov);
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
      const clean = sanitizeForFirestore(mat);
      assertNoUndefined(clean);
      await setDoc(doc(db, 'materials', mat.id), clean);
    }
    for (const mov of data.movements) {
      const clean = sanitizeForFirestore(mov);
      assertNoUndefined(clean);
      await setDoc(doc(db, 'movements', mov.id), clean);
    }
    for (const site of data.worksites) {
      const clean = sanitizeForFirestore(site);
      assertNoUndefined(clean);
      await setDoc(doc(db, 'worksites', site.id), clean);
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
            selectedWorksiteId={selectedWorksiteId}
            onOpenQuickMovement={handleOpenQuickMovement}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'materials' && (
            <MaterialsView
              materials={unifiedMaterials}
              worksites={worksites}
              movements={movements}
              currentUser={currentUser}
              selectedWorksiteId={selectedWorksiteId}
              onSelectWorksite={(id) => setSelectedWorksiteId(id)}
              onOpenNewMaterial={() => {
                setMaterialToEdit(null);
                setIsMaterialFormOpen(true);
              }}
              onEditMaterial={(mat) => {
                const foundInsumo = catalogoInsumos.find((i) => i.id === mat.id || i.codigoExterno === mat.code);
                if (foundInsumo) {
                  setSelectedInsumoForEdit(foundInsumo);
                  setIsGlobalEditOpen(true);
                } else {
                  setMaterialToEdit(mat);
                  setIsMaterialFormOpen(true);
                }
              }}
              onDeleteMaterial={handleDeleteMaterial}
              onOpenQuickMovement={handleOpenQuickMovement}
              onOpenImportCsv={() => setIsCsvImportOpen(true)}
              onOpenHistoryInsumo={(mat) => {
                const foundInsumo = catalogoInsumos.find((i) => i.id === mat.id || i.codigoExterno === mat.code);
                if (foundInsumo) {
                  setSelectedInsumoForHistory(foundInsumo);
                  setIsHistoryModalOpen(true);
                } else {
                  alert('Histórico disponível para insumos do Catálogo Global.');
                }
              }}
            />
          )}

        {activeTab === 'movements' && (
          <MovementsView
            movements={movements}
            worksites={worksites}
            currentUser={currentUser}
            selectedWorksiteId={selectedWorksiteId}
            onSelectWorksite={(id) => setSelectedWorksiteId(id)}
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
            globalSelectedWorksiteId={selectedWorksiteId}
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
            selectedWorksiteId={selectedWorksiteId}
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
        materials={unifiedMaterials}
        catalogoInsumos={catalogoInsumos}
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
        currentUser={currentUser}
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

      {/* CSV Global Catalog Import Modal */}
      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        existingCatalog={catalogoInsumos}
        currentUser={currentUser}
        onImportCompleted={() => {
          setIsCsvImportOpen(false);
        }}
      />

      {/* Edit Global Catalog Item Modal */}
      <GlobalCatalogItemEditModal
        isOpen={isGlobalEditOpen}
        onClose={() => setIsGlobalEditOpen(false)}
        insumo={selectedInsumoForEdit}
        currentUser={currentUser}
        onSaveInsumo={handleSaveGlobalInsumo}
      />

      {/* Audit History Modal */}
      <CatalogAuditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        insumo={selectedInsumoForHistory}
        historyLogs={historicoLogs}
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
