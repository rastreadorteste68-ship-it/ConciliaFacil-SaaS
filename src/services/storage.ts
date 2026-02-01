
import { Client, ServiceOrder } from "../types";

const PREFIX = 'concilia_saas_';

export const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(PREFIX + key);
    if (!data) return defaultValue;
    try {
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  },
  set: <T,>(key: string, value: T): void => {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  
  getClients: (): Client[] => storage.get<Client[]>('clients', []),
  saveClients: (clients: Client[]) => storage.set('clients', clients),
  
  // FIX: Added getOrders to handle service order retrieval from local storage
  getOrders: (): ServiceOrder[] => storage.get<ServiceOrder[]>('orders', []),
  
  // FIX: Added saveOrders to persist service orders
  saveOrders: (orders: ServiceOrder[]) => storage.set('orders', orders),
  
  updateClient: (updatedClient: Client) => {
    const clients = storage.getClients();
    const index = clients.findIndex(c => c.id === updatedClient.id);
    if (index >= 0) {
      clients[index] = updatedClient;
    } else {
      clients.push(updatedClient);
    }
    storage.saveClients(clients);
  },

  clearData: () => {
    localStorage.removeItem(PREFIX + 'clients');
    localStorage.removeItem(PREFIX + 'orders');
  }
};
