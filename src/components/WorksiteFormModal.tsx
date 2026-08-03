import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, HardHat, DollarSign, Clock, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { WorkSite } from '../types';

interface WorksiteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  worksiteToEdit: WorkSite | null;
  onSaveWorksite: (worksiteData: Omit<WorkSite, 'id' | 'totalSpentMaterials'>, id?: string) => void;
  onDeleteWorksite?: (id: string) => void;
}

export const WorksiteFormModal: React.FC<WorksiteFormModalProps> = ({
  isOpen,
  onClose,
  worksiteToEdit,
  onSaveWorksite,
  onDeleteWorksite,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [engineerInCharge, setEngineerInCharge] = useState('');
  const [budgetMaterials, setBudgetMaterials] = useState('');
  const [status, setStatus] = useState<'Em Andamento' | 'Planejamento' | 'Concluída'>('Em Andamento');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (worksiteToEdit) {
      setCode(worksiteToEdit.code);
      setName(worksiteToEdit.name);
      setAddress(worksiteToEdit.address);
      setEngineerInCharge(worksiteToEdit.engineerInCharge);
      setBudgetMaterials(worksiteToEdit.budgetMaterials ? String(worksiteToEdit.budgetMaterials) : '');
      setStatus(worksiteToEdit.status);
    } else {
      setCode(`OBR-${Math.floor(100 + Math.random() * 900)}`);
      setName('');
      setAddress('');
      setEngineerInCharge('');
      setBudgetMaterials('');
      setStatus('Em Andamento');
    }
    setErrorMsg('');
  }, [worksiteToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('O nome da obra é obrigatório.');
      return;
    }

    const budgetVal = parseFloat(budgetMaterials);
    if (isNaN(budgetVal) || budgetVal < 0) {
      setErrorMsg('Informe um orçamento válido para materiais (R$).');
      return;
    }

    onSaveWorksite(
      {
        code: code.trim() || 'OBR-000',
        name: name.trim(),
        address: address.trim() || 'Canteiro de Obras',
        engineerInCharge: engineerInCharge.trim() || 'Engenheiro Responsável',
        budgetMaterials: budgetVal,
        status,
        startDate: worksiteToEdit?.startDate || new Date().toISOString().slice(0, 10),
      },
      worksiteToEdit?.id
    );

    onClose();
  };

  const handleDelete = () => {
    if (!worksiteToEdit || !onDeleteWorksite) return;
    if (confirm(`Tem certeza que deseja excluir o canteiro de obras "${worksiteToEdit.name}"?`)) {
      onDeleteWorksite(worksiteToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0F0F11] rounded-2xl border border-[#1F1F21] w-full max-w-lg overflow-hidden my-auto shadow-2xl text-white animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#151517] border-b border-[#1F1F21] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#F2A30F]/20 text-[#F2A30F] rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {worksiteToEdit ? 'Editar Canteiro de Obra' : 'Cadastrar Nova Obra'}
              </h2>
              <p className="text-xs text-[#888888]">
                {worksiteToEdit ? `Código: ${worksiteToEdit.code}` : 'Preencha os dados do canteiro'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#888888] hover:text-white rounded-lg hover:bg-[#1F1F21] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 text-red-300 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Código da Obra</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="OBR-101"
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:border-[#F2A30F] outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Status do Projeto</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl p-2 text-xs text-white focus:border-[#F2A30F] outline-none"
              >
                <option value="Em Andamento">🟢 Em Andamento</option>
                <option value="Planejamento">🔵 Em Planejamento</option>
                <option value="Concluída">⚪ Concluída</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Nome da Obra / Edifício *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Residencial Horizon Torre B"
              className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#555555] focus:border-[#F2A30F] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Endereço / Localização</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#666666] absolute left-3 top-2.5" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Av. das Nações, 1500 - Setor Sul"
                className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#555555] focus:border-[#F2A30F] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Engenheiro Responsável</label>
              <div className="relative">
                <HardHat className="w-4 h-4 text-[#F2A30F] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={engineerInCharge}
                  onChange={(e) => setEngineerInCharge(e.target.value)}
                  placeholder="ex: Eng. Roberto Lima"
                  className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#555555] focus:border-[#F2A30F] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Orçamento de Materiais (R$) *</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={budgetMaterials}
                  onChange={(e) => setBudgetMaterials(e.target.value)}
                  placeholder="ex: 150000"
                  className="w-full bg-[#151517] border border-[#1F1F21] rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-[#555555] focus:border-[#F2A30F] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1F1F21]">
            {worksiteToEdit && onDeleteWorksite ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Obra</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#1F1F21] bg-[#151517] hover:bg-[#1F1F21] text-xs font-semibold rounded-xl text-[#AAAAAA] hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#F2A30F] hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                {worksiteToEdit ? 'Salvar Alterações' : 'Cadastrar Obra'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
