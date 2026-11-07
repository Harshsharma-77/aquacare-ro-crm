export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  area?: string;
  googleMapsUrl?: string;
  latitude?: number;
  longitude?: number;
  roBrand: string;
  roModel: string;
  installationDate: string; // YYYY-MM-DD
  rawWaterTds?: number;
  outputTds?: number;
  notes?: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
  // Computed helpers for quick display
  lastServiceDate?: string;
  nextServiceDueDate?: string;
  lastServiceType?: ServiceType;
}

export type ServiceType = 'small' | 'major' | 'repair' | 'installation';

export interface PartItem {
  id: string;
  name: string;
  category: 'filter' | 'membrane' | 'electrical' | 'fittings' | 'body' | 'custom' | 'general';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isCustom?: boolean;
}

export type PaymentStatus = 'paid' | 'pending' | 'partial';
export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer';

export interface ServiceRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  roBrand?: string;
  roModel?: string;
  serviceType: ServiceType;
  serviceDate: string; // YYYY-MM-DD
  nextDueDate: string; // YYYY-MM-DD
  technicianName: string;
  partsUsed: PartItem[];
  partsCost: number;
  serviceCharge: number;
  discount?: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  rawWaterTds?: number;
  outputTds?: number;
  customerSignature?: string; // base64 data url
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  remarks?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'filter' | 'membrane' | 'electrical' | 'fittings' | 'body' | 'general';
  sku: string;
  currentStock: number;
  minStockLevel: number;
  costPrice: number;
  unitPrice: number;
  description?: string;
  updatedAt: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  specialty?: string;
  active: boolean;
}

export interface AppSettings {
  shopName: string;
  tagline: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  city: string;
  gstNumber?: string;
  upiId?: string;
  smallServiceIntervalMonths: number; // default 6
  majorServiceIntervalMonths: number; // default 12
  reminderTemplate: string;
  completedTemplate: string;
  promoTemplate: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  isSupabaseConnected?: boolean;
}

export interface ReminderLog {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  serviceId?: string;
  reminderType: 'whatsapp' | 'sms' | 'call';
  message: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
}

export type UrgencyLevel = 'overdue' | 'due-today' | 'due-week' | 'due-month' | 'upcoming';
