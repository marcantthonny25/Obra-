import { User } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-coord',
    name: 'Eng. Fernando Souza',
    email: 'coordenador@hogar.com',
    password: '123',
    role: 'Coordenador de Obra',
    createdAt: '2026-01-05T08:00:00Z',
    worksiteAssigned: 'Todos os Canteiros de Obras',
  },
  {
    id: 'usr-eng',
    name: 'Engª. Mariana Costa',
    email: 'engenheira@hogar.com',
    password: '123',
    role: 'Engenheira/o',
    createdAt: '2026-01-08T09:00:00Z',
    worksiteAssigned: 'Todos os Canteiros de Obras',
  },
  {
    id: 'usr-1',
    name: 'Carlos Andrade',
    email: 'carlos.almoxarife@obras.com',
    password: '123',
    role: 'Almoxarife',
    createdAt: '2026-01-10T10:00:00Z',
    worksiteAssigned: 'Almoxarifado Central',
  },
  {
    id: 'usr-2',
    name: 'Engª. Roberto Lima',
    email: 'roberto.engenharia@obras.com',
    password: '123',
    role: 'Engenheiro Residente',
    createdAt: '2026-01-15T14:30:00Z',
    worksiteAssigned: 'Residencial Horizon',
  },
  {
    id: 'usr-3',
    name: 'Marcos Mestre',
    email: 'marcos.mestre@obras.com',
    password: '123',
    role: 'Mestre de Obras',
    createdAt: '2026-02-01T08:00:00Z',
    worksiteAssigned: 'Torre Alvorada Commercial',
  },
];
