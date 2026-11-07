import { Customer, ServiceRecord, InventoryItem, Technician, AppSettings, ReminderLog } from '@/types';
import { defaultCustomers, defaultServices, defaultInventory, defaultTechnicians, defaultSettings } from './defaultData';
import { createSupabaseClient } from './supabaseClient';

const STORAGE_KEYS = {
  CUSTOMERS: 'aquaflow_customers_v1',
  SERVICES: 'aquaflow_services_v1',
  INVENTORY: 'aquaflow_inventory_v1',
  TECHNICIANS: 'aquaflow_technicians_v1',
  SETTINGS: 'aquaflow_settings_v1',
  REMINDERS: 'aquaflow_reminders_v1',
  INITIALIZED: 'aquaflow_initialized_v1'
};

class StorageService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Initialize seed data if not present
  public init(): void {
    if (!this.isBrowser()) return;

    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      this.setCustomers(defaultCustomers);
      this.setServices(defaultServices);
      this.setInventory(defaultInventory);
      this.setTechnicians(defaultTechnicians);
      this.setSettings(defaultSettings);
      this.setReminders([]);
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  // Reset to default sample data
  public resetToDefault(): void {
    if (!this.isBrowser()) return;
    this.setCustomers(defaultCustomers);
    this.setServices(defaultServices);
    this.setInventory(defaultInventory);
    this.setTechnicians(defaultTechnicians);
    this.setSettings(defaultSettings);
    this.setReminders([]);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    this.notifyChange();
  }

  // ================= CUSTOMERS =================
  public getCustomers(): Customer[] {
    if (!this.isBrowser()) return defaultCustomers;
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!data) {
      this.setCustomers(defaultCustomers);
      return defaultCustomers;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultCustomers;
    }
  }

  public setCustomers(customers: Customer[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.notifyChange();
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  public saveCustomer(customer: Partial<Customer> & { name: string; phone: string }): Customer {
    const customers = this.getCustomers();
    const now = new Date().toISOString().split('T')[0];
    
    if (customer.id) {
      // Update existing
      const index = customers.findIndex(c => c.id === customer.id);
      if (index !== -1) {
        const updated: Customer = {
          ...customers[index],
          ...customer,
          updatedAt: now
        };
        customers[index] = updated;
        this.setCustomers(customers);
        this.syncToSupabase('customers', updated);
        return updated;
      }
    }

    // Create new
    const newCustomer: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: customer.name,
      phone: customer.phone,
      alternatePhone: customer.alternatePhone || '',
      address: customer.address || '',
      area: customer.area || '',
      googleMapsUrl: customer.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(customer.address || customer.name)}`,
      latitude: customer.latitude,
      longitude: customer.longitude,
      roBrand: customer.roBrand || 'Kent',
      roModel: customer.roModel || 'Standard RO Purifier',
      installationDate: customer.installationDate || now,
      rawWaterTds: customer.rawWaterTds,
      outputTds: customer.outputTds,
      notes: customer.notes || '',
      status: customer.status || 'active',
      createdAt: now,
      updatedAt: now,
      nextServiceDueDate: customer.nextServiceDueDate
    };

    customers.unshift(newCustomer);
    this.setCustomers(customers);
    this.syncToSupabase('customers', newCustomer);
    return newCustomer;
  }

  public deleteCustomer(id: string): void {
    let customers = this.getCustomers();
    customers = customers.filter(c => c.id !== id);
    this.setCustomers(customers);
  }

  // ================= SERVICES =================
  public getServices(): ServiceRecord[] {
    if (!this.isBrowser()) return defaultServices;
    const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!data) {
      this.setServices(defaultServices);
      return defaultServices;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultServices;
    }
  }

  public setServices(services: ServiceRecord[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    this.notifyChange();
  }

  public getServicesByCustomerId(customerId: string): ServiceRecord[] {
    return this.getServices()
      .filter(s => s.customerId === customerId)
      .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
  }

  public saveService(service: Omit<ServiceRecord, 'id' | 'createdAt'> & { id?: string }): ServiceRecord {
    const services = this.getServices();
    const now = new Date().toISOString().split('T')[0];

    const serviceId = service.id || `srv-${Date.now()}`;
    const newService: ServiceRecord = {
      ...service,
      id: serviceId,
      createdAt: now
    };

    // Auto-update customer's last service and next due date
    const customers = this.getCustomers();
    const custIndex = customers.findIndex(c => c.id === service.customerId);
    if (custIndex !== -1) {
      customers[custIndex] = {
        ...customers[custIndex],
        lastServiceDate: service.serviceDate,
        nextServiceDueDate: service.nextDueDate,
        lastServiceType: service.serviceType,
        rawWaterTds: service.rawWaterTds ?? customers[custIndex].rawWaterTds,
        outputTds: service.outputTds ?? customers[custIndex].outputTds,
        updatedAt: now
      };
      this.setCustomers(customers);
    }

    // Auto-deduct inventory parts
    if (service.partsUsed && service.partsUsed.length > 0) {
      const inventory = this.getInventory();
      service.partsUsed.forEach(part => {
        const itemIndex = inventory.findIndex(inv => inv.id === part.id || inv.name.toLowerCase() === part.name.toLowerCase());
        if (itemIndex !== -1) {
          inventory[itemIndex].currentStock = Math.max(0, inventory[itemIndex].currentStock - (part.quantity || 1));
          inventory[itemIndex].updatedAt = new Date().toISOString();
        }
      });
      this.setInventory(inventory);
    }

    if (service.id) {
      const idx = services.findIndex(s => s.id === service.id);
      if (idx !== -1) {
        services[idx] = newService;
      } else {
        services.unshift(newService);
      }
    } else {
      services.unshift(newService);
    }

    this.setServices(services);
    this.syncToSupabase('services', newService);
    return newService;
  }

  public deleteService(id: string): void {
    let services = this.getServices();
    services = services.filter(s => s.id !== id);
    this.setServices(services);
  }

  // ================= INVENTORY =================
  public getInventory(): InventoryItem[] {
    if (!this.isBrowser()) return defaultInventory;
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!data) {
      this.setInventory(defaultInventory);
      return defaultInventory;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultInventory;
    }
  }

  public setInventory(inventory: InventoryItem[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    this.notifyChange();
  }

  public saveInventoryItem(item: Partial<InventoryItem> & { name: string; unitPrice: number }): InventoryItem {
    const inventory = this.getInventory();
    const now = new Date().toISOString();

    if (item.id) {
      const index = inventory.findIndex(i => i.id === item.id);
      if (index !== -1) {
        const updated: InventoryItem = {
          ...inventory[index],
          ...item,
          updatedAt: now
        };
        inventory[index] = updated;
        this.setInventory(inventory);
        return updated;
      }
    }

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: item.name,
      category: item.category || 'filter',
      sku: item.sku || `SKU-${Date.now().toString().slice(-4)}`,
      currentStock: Number(item.currentStock) || 0,
      minStockLevel: Number(item.minStockLevel) || 5,
      costPrice: Number(item.costPrice) || 0,
      unitPrice: Number(item.unitPrice) || 0,
      description: item.description || '',
      updatedAt: now
    };

    inventory.push(newItem);
    this.setInventory(inventory);
    return newItem;
  }

  public updateStock(itemId: string, delta: number): void {
    const inventory = this.getInventory();
    const item = inventory.find(i => i.id === itemId);
    if (item) {
      item.currentStock = Math.max(0, item.currentStock + delta);
      item.updatedAt = new Date().toISOString();
      this.setInventory(inventory);
    }
  }

  // ================= TECHNICIANS =================
  public getTechnicians(): Technician[] {
    if (!this.isBrowser()) return defaultTechnicians;
    const data = localStorage.getItem(STORAGE_KEYS.TECHNICIANS);
    if (!data) {
      this.setTechnicians(defaultTechnicians);
      return defaultTechnicians;
    }
    try {
      return JSON.parse(data);
    } catch {
      return defaultTechnicians;
    }
  }

  public setTechnicians(techs: Technician[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.TECHNICIANS, JSON.stringify(techs));
    this.notifyChange();
  }

  public saveTechnician(tech: Partial<Technician> & { name: string; phone: string }): Technician {
    const techs = this.getTechnicians();
    if (tech.id) {
      const idx = techs.findIndex(t => t.id === tech.id);
      if (idx !== -1) {
        techs[idx] = { ...techs[idx], ...tech };
        this.setTechnicians(techs);
        return techs[idx];
      }
    }
    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      name: tech.name,
      phone: tech.phone,
      specialty: tech.specialty || 'RO Specialist',
      active: tech.active ?? true
    };
    techs.push(newTech);
    this.setTechnicians(techs);
    return newTech;
  }

  // ================= SETTINGS =================
  public getSettings(): AppSettings {
    if (!this.isBrowser()) return defaultSettings;
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      this.setSettings(defaultSettings);
      return defaultSettings;
    }
    try {
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch {
      return defaultSettings;
    }
  }

  public setSettings(settings: AppSettings): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    this.notifyChange();
  }

  // ================= REMINDER LOGS =================
  public getReminders(): ReminderLog[] {
    if (!this.isBrowser()) return [];
    const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public setReminders(reminders: ReminderLog[]): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    this.notifyChange();
  }

  public logReminder(reminder: Omit<ReminderLog, 'id' | 'sentAt'>): ReminderLog {
    const reminders = this.getReminders();
    const newLog: ReminderLog = {
      ...reminder,
      id: `rem-${Date.now()}`,
      sentAt: new Date().toISOString()
    };
    reminders.unshift(newLog);
    this.setReminders(reminders);
    return newLog;
  }

  // ================= BACKUP & RESTORE =================
  public exportAllData(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      customers: this.getCustomers(),
      services: this.getServices(),
      inventory: this.getInventory(),
      technicians: this.getTechnicians(),
      settings: this.getSettings(),
      reminders: this.getReminders()
    };
    return JSON.stringify(payload, null, 2);
  }

  public importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.customers) this.setCustomers(parsed.customers);
      if (parsed.services) this.setServices(parsed.services);
      if (parsed.inventory) this.setInventory(parsed.inventory);
      if (parsed.technicians) this.setTechnicians(parsed.technicians);
      if (parsed.settings) this.setSettings(parsed.settings);
      if (parsed.reminders) this.setReminders(parsed.reminders);
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  }

  // ================= DATABASE CLOUD SYNC (SUPABASE / NEON) =================
  private async syncToSupabase(table: string, record: any) {
    // 1. Neon API sync (when DATABASE_URL is set on Vercel / Render)
    try {
      if (this.isBrowser()) {
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upsert', table, data: record }),
        }).catch(() => {});
      }
    } catch {}

    // 2. Supabase direct client sync
    try {
      const client = createSupabaseClient();
      if (!client) return;
      await client.from(table).upsert(record);
    } catch (e) {
      console.warn(`Supabase background sync skipped for ${table}`, e);
    }
  }

  // Reactive subscription
  private notifyChange() {
    if (this.isBrowser()) {
      window.dispatchEvent(new Event('aquaflow_storage_updated'));
    }
  }
}

export const storage = new StorageService();
