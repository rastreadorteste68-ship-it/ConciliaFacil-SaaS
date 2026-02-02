
import { Client } from './types';

const STORAGE_KEY = 'concilia_facil_v3_master';

// Lista base inicial conforme solicitado
export const INITIAL_CLIENTS_BASE = [
  { id: "1", name: "Amós Silva De Oliveira", startDate: "2025-02", expectedAmount: 450.00 },
  { id: "2", name: "S.s Laboratorio De Protese Ltda", startDate: "2025-01", expectedAmount: 1200.00 },
  { id: "3", name: "Rafael Rodrigues Silva", startDate: "2024-01", expectedAmount: 350.00 },
  { id: "4", name: "Emptech Máquinas De Manutenção Eireli", startDate: "2024-11", expectedAmount: 2500.00 },
  { id: "5", name: "Marcio Pereira Nishikawara", startDate: "2025-01", expectedAmount: 600.00 },
  { id: "6", name: "Angelita Avanci De Oliveira", startDate: "2025-03", expectedAmount: 450.00 },
  { id: "7", name: "Octavio Vieira Silva", startDate: "2025-01", expectedAmount: 850.00 }
];

export const storage = {
  // Busca todos os clientes salvos ou inicia com a lista base
  getClients: (): Client[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const seeded: Client[] = INITIAL_CLIENTS_BASE.map(base => ({
        ...base,
        months: [],
        progress: 0
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(data);
  },

  // Salva a lista completa (Clientes + Análises)
  saveClients: (clients: Client[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  },

  // Adiciona um novo cliente à memória persistente
  addClient: (name: string, startDate: string, expectedAmount: number) => {
    const clients = storage.getClients();
    const newClient: Client = {
      id: crypto.randomUUID(),
      name,
      startDate,
      expectedAmount,
      months: [],
      progress: 0
    };
    const updated = [...clients, newClient];
    storage.saveClients(updated);
    return updated;
  },

  // Limpa todos os dados (útil para resets de teste)
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};
