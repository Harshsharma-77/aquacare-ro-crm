'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  History,
  MessageSquare,
  Calendar,
  Package,
  BarChart3,
  Settings,
  Plus,
  Wrench,
  Droplets,
  Bell,
  Menu,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { Customer, ServiceRecord, InventoryItem, Technician, AppSettings } from '@/types';
import { storage } from '@/lib/storage';
import { getServiceUrgency } from '@/lib/utils';
import { generateServiceInvoicePDF } from '@/lib/pdfGenerator';
import { openWhatsApp, buildCompletedServiceMessage } from '@/lib/whatsapp';

// UI Components
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { DashboardOverview } from '@/components/DashboardOverview';
import { CustomerList } from '@/components/CustomerList';
import { CustomerModal } from '@/components/CustomerModal';
import { CustomerImportModal } from '@/components/CustomerImportModal';
import { CustomerDetailModal } from '@/components/CustomerDetailModal';
import { ServiceLogModal } from '@/components/ServiceLogModal';
import { ServiceHistoryList } from '@/components/ServiceHistoryList';
import { WhatsAppRemindersHub } from '@/components/WhatsAppRemindersHub';
import { ServiceCalendar } from '@/components/ServiceCalendar';
import { InventoryManager } from '@/components/InventoryManager';
import { ReportsAnalytics } from '@/components/ReportsAnalytics';
import { MachineQRStickerModal } from '@/components/MachineQRStickerModal';
import { ServiceInvoiceModal } from '@/components/ServiceInvoiceModal';
import { SettingsModal } from '@/components/SettingsModal';

export default function Home() {
  // 1. Core State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());

  // 2. Modals State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [isCustomerDetailOpen, setIsCustomerDetailOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [serviceCustomerTarget, setServiceCustomerTarget] = useState<Customer | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceRecord | null>(null);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCustomerTarget, setQrCustomerTarget] = useState<Customer | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Load and subscribe to storage
  const loadData = () => {
    storage.init();
    setCustomers(storage.getCustomers());
    setServices(storage.getServices());
    setInventory(storage.getInventory());
    setTechnicians(storage.getTechnicians());
    setSettings(storage.getSettings());
  };

  useEffect(() => {
    loadData();

    const handleStorageUpdate = () => {
      loadData();
    };

    window.addEventListener('aquaflow_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('aquaflow_storage_updated', handleStorageUpdate);
  }, []);

  // Compute urgent due count for notifications & badges
  const dueCount = customers.filter(c => {
    if (c.status === 'inactive') return false;
    const u = getServiceUrgency(c.nextServiceDueDate);
    return u.level === 'overdue' || u.level === 'due-today' || u.level === 'due-week';
  }).length;

  const lowStockCount = inventory.filter(i => i.currentStock <= i.minStockLevel).length;

  // Handlers
  const handleSaveCustomer = (customerData: Partial<Customer> & { name: string; phone: string }) => {
    const saved = storage.saveCustomer(customerData);
    loadData();
    if (!customerData.id) {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.85 } });
      } catch {}
    }
  };

  const handleBatchImportCustomers = (imported: (Partial<Customer> & { name: string; phone: string })[]) => {
    const count = storage.saveCustomersBatch(imported);
    loadData();
    try {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.7 } });
    } catch {}
    alert(`Successfully imported ${count} customers from Excel!`);
  };

  const handleDeleteCustomer = (id: string) => {
    storage.deleteCustomer(id);
    loadData();
  };

  const handleSaveService = (
    serviceData: Omit<ServiceRecord, 'id' | 'createdAt'> & { id?: string },
    generateInvoice: boolean = false,
    sendWhatsApp: boolean = false
  ) => {
    const saved = storage.saveService(serviceData);
    loadData();

    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
    } catch {}

    if (generateInvoice) {
      generateServiceInvoicePDF(saved, settings);
    }

    if (sendWhatsApp) {
      const msg = buildCompletedServiceMessage(saved, settings);
      openWhatsApp(saved.customerPhone, msg);
    }
  };

  const handleDeleteService = (id: string) => {
    storage.deleteService(id);
    loadData();
  };

  const handleSaveInventoryItem = (itemData: Partial<InventoryItem> & { name: string; unitPrice: number }) => {
    storage.saveInventoryItem(itemData);
    loadData();
  };

  const handleUpdateStock = (itemId: string, delta: number) => {
    storage.updateStock(itemId, delta);
    loadData();
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    storage.setSettings(newSettings);
    setSettings(newSettings);
  };

  const handleSaveTechnicians = (techs: Technician[]) => {
    storage.setTechnicians(techs);
    setTechnicians(techs);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <Navbar
        settings={settings}
        customers={customers}
        onOpenNewCustomer={() => {
          setCustomerToEdit(null);
          setIsCustomerModalOpen(true);
        }}
        onOpenNewService={() => {
          setServiceCustomerTarget(null);
          setIsServiceModalOpen(true);
        }}
        onOpenWhatsAppHub={() => setActiveTab('reminders')}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onSelectCustomer={(cust) => {
          setSelectedCustomer(cust);
          setIsCustomerDetailOpen(true);
        }}
        activeTab={activeTab}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            dueCount={dueCount}
            lowStockCount={lowStockCount}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        </div>

        {/* Dynamic Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              customers={customers}
              services={services}
              inventory={inventory}
              settings={settings}
              onNavigateTab={setActiveTab}
              onSelectCustomer={(c) => {
                setSelectedCustomer(c);
                setIsCustomerDetailOpen(true);
              }}
              onSelectService={(s) => {
                setSelectedService(s);
                setIsInvoiceModalOpen(true);
              }}
              onOpenNewCustomer={() => {
                setCustomerToEdit(null);
                setIsCustomerModalOpen(true);
              }}
              onOpenNewService={() => {
                setServiceCustomerTarget(null);
                setIsServiceModalOpen(true);
              }}
              onOpenWhatsAppHub={() => setActiveTab('reminders')}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerList
              customers={customers}
              settings={settings}
              onSelectCustomer={(c) => {
                setSelectedCustomer(c);
                setIsCustomerDetailOpen(true);
              }}
              onEditCustomer={(c) => {
                setCustomerToEdit(c);
                setIsCustomerModalOpen(true);
              }}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenNewCustomer={() => {
                setCustomerToEdit(null);
                setIsCustomerModalOpen(true);
              }}
              onLogServiceForCustomer={(c) => {
                setServiceCustomerTarget(c);
                setIsServiceModalOpen(true);
              }}
              onShowQRSticker={(c) => {
                setQrCustomerTarget(c);
                setIsQRModalOpen(true);
              }}
              onOpenImportExcel={() => setIsImportModalOpen(true)}
            />
          )}

          {activeTab === 'services' && (
            <ServiceHistoryList
              services={services}
              settings={settings}
              onSelectService={(s) => {
                setSelectedService(s);
                setIsInvoiceModalOpen(true);
              }}
              onOpenNewService={() => {
                setServiceCustomerTarget(null);
                setIsServiceModalOpen(true);
              }}
              onDeleteService={handleDeleteService}
            />
          )}

          {activeTab === 'reminders' && (
            <WhatsAppRemindersHub
              customers={customers}
              settings={settings}
              onUpdateSettings={handleSaveSettings}
              onSelectCustomer={(c) => {
                setSelectedCustomer(c);
                setIsCustomerDetailOpen(true);
              }}
            />
          )}

          {activeTab === 'calendar' && (
            <ServiceCalendar
              customers={customers}
              services={services}
              settings={settings}
              onSelectCustomer={(c) => {
                setSelectedCustomer(c);
                setIsCustomerDetailOpen(true);
              }}
              onLogService={(c) => {
                setServiceCustomerTarget(c);
                setIsServiceModalOpen(true);
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager
              inventory={inventory}
              onSaveItem={handleSaveInventoryItem}
              onUpdateStock={handleUpdateStock}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsAnalytics
              customers={customers}
              services={services}
              inventory={inventory}
              technicians={technicians}
              settings={settings}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Field Technicians) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition ${
            activeTab === 'dashboard' ? 'text-teal-600' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition ${
            activeTab === 'customers' ? 'text-teal-600' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Customers</span>
        </button>

        <button
          onClick={() => {
            setServiceCustomerTarget(null);
            setIsServiceModalOpen(true);
          }}
          className="flex flex-col items-center -mt-5 bg-teal-600 text-white p-3 rounded-full shadow-lg shadow-teal-600/30"
          title="Quick Service"
        >
          <Wrench className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold relative transition ${
            activeTab === 'reminders' ? 'text-teal-600' : 'text-slate-500'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Due</span>
          {dueCount > 0 && (
            <span className="absolute top-0 right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {dueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-semibold transition ${
            activeTab === 'calendar' ? 'text-teal-600' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Calendar</span>
        </button>
      </div>

      {/* MODALS */}
      {/* 1. Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />

      {/* 1.1 Bulk Import Customer Modal */}
      <CustomerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleBatchImportCustomers}
      />

      {/* 2. Customer 360 Detail Modal */}
      <CustomerDetailModal
        isOpen={isCustomerDetailOpen}
        onClose={() => setIsCustomerDetailOpen(false)}
        customer={selectedCustomer}
        services={services}
        settings={settings}
        onEditCustomer={(c) => {
          setIsCustomerDetailOpen(false);
          setCustomerToEdit(c);
          setIsCustomerModalOpen(true);
        }}
        onLogService={(c) => {
          setIsCustomerDetailOpen(false);
          setServiceCustomerTarget(c);
          setIsServiceModalOpen(true);
        }}
        onShowQRSticker={(c) => {
          setIsCustomerDetailOpen(false);
          setQrCustomerTarget(c);
          setIsQRModalOpen(true);
        }}
        onSelectService={(s) => {
          setSelectedService(s);
          setIsInvoiceModalOpen(true);
        }}
      />

      {/* 3. Log Service Record Modal */}
      <ServiceLogModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        customers={customers}
        inventory={inventory}
        technicians={technicians}
        settings={settings}
        preSelectedCustomer={serviceCustomerTarget}
        onSaveService={handleSaveService}
      />

      {/* 4. Service Invoice Receipt Modal */}
      <ServiceInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        service={selectedService}
        settings={settings}
      />

      {/* 5. Machine QR Sticker Tag Modal */}
      <MachineQRStickerModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        customer={qrCustomerTarget}
        settings={settings}
      />

      {/* 6. Settings & Supabase Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        technicians={technicians}
        onSaveSettings={handleSaveSettings}
        onSaveTechnicians={handleSaveTechnicians}
        onDataReset={loadData}
      />
    </div>
  );
}
