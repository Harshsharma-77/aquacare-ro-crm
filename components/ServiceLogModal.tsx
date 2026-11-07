'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Wrench,
  User,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  FileText,
  MessageSquare,
  Sparkles,
  Camera,
  PenTool,
  CheckCircle2,
  Droplet
} from 'lucide-react';
import { Customer, ServiceRecord, ServiceType, PartItem, InventoryItem, Technician, PaymentStatus, PaymentMode, AppSettings } from '@/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { format, addMonths, parseISO } from 'date-fns';
import { openWhatsApp, buildCompletedServiceMessage } from '@/lib/whatsapp';

interface ServiceLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  inventory: InventoryItem[];
  technicians: Technician[];
  settings: AppSettings;
  preSelectedCustomer?: Customer | null;
  onSaveService: (service: Omit<ServiceRecord, 'id' | 'createdAt'> & { id?: string }, generateInvoice?: boolean, sendWhatsApp?: boolean) => void;
}

export const ServiceLogModal: React.FC<ServiceLogModalProps> = ({
  isOpen,
  onClose,
  customers,
  inventory,
  technicians,
  settings,
  preSelectedCustomer,
  onSaveService
}) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [serviceType, setServiceType] = useState<ServiceType>('small');
  const [serviceDate, setServiceDate] = useState<string>(todayStr);
  const [nextDueDate, setNextDueDate] = useState<string>(format(addMonths(new Date(), 6), 'yyyy-MM-dd'));
  const [technicianName, setTechnicianName] = useState<string>('');
  const [partsUsed, setPartsUsed] = useState<PartItem[]>([]);
  const [serviceCharge, setServiceCharge] = useState<number>(300);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [rawWaterTds, setRawWaterTds] = useState<number | ''>('');
  const [outputTds, setOutputTds] = useState<number | ''>('');
  const [remarks, setRemarks] = useState<string>('');
  const [beforePhotoUrl, setBeforePhotoUrl] = useState<string>('');
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string>('');

  // Signature Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Initial populate
  useEffect(() => {
    if (preSelectedCustomer) {
      setSelectedCustomerId(preSelectedCustomer.id);
      setRawWaterTds(preSelectedCustomer.rawWaterTds ?? '');
      setOutputTds(preSelectedCustomer.outputTds ?? '');
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
      setRawWaterTds(customers[0].rawWaterTds ?? '');
      setOutputTds(customers[0].outputTds ?? '');
    }

    if (technicians.length > 0 && !technicianName) {
      setTechnicianName(technicians[0].name);
    }
  }, [preSelectedCustomer, customers, technicians, isOpen]);

  // Handle service type change and auto-fill parts + auto-calculate next due date
  const handleServiceTypeChange = (type: ServiceType) => {
    setServiceType(type);
    const baseDate = serviceDate ? parseISO(serviceDate) : new Date();

    if (type === 'small') {
      // +6 Months Next Due
      setNextDueDate(format(addMonths(baseDate, settings.smallServiceIntervalMonths || 6), 'yyyy-MM-dd'));
      setServiceCharge(300);
      
      // Auto pre-populate PP Spun Candle
      const spunItem = inventory.find(i => i.sku === 'FLT-PP-10' || i.name.toLowerCase().includes('pp spun'));
      if (spunItem) {
        setPartsUsed([
          {
            id: spunItem.id,
            name: spunItem.name,
            category: 'filter',
            quantity: 1,
            unitPrice: spunItem.unitPrice,
            totalPrice: spunItem.unitPrice
          }
        ]);
      } else {
        setPartsUsed([
          {
            id: 'custom-pp',
            name: 'PP Spun Candle Filter (5 Micron)',
            category: 'filter',
            quantity: 1,
            unitPrice: 200,
            totalPrice: 200
          }
        ]);
      }
      setRemarks('Replaced PP Spun Candle. Pre-filter housing cleaned & descaled. System checked.');
    } else if (type === 'major') {
      // +12 Months Next Due
      setNextDueDate(format(addMonths(baseDate, settings.majorServiceIntervalMonths || 12), 'yyyy-MM-dd'));
      setServiceCharge(450);

      // Auto pre-populate Major Filter stack
      const initialMajorParts: PartItem[] = [];
      const spun = inventory.find(i => i.sku === 'FLT-PP-10');
      const sed = inventory.find(i => i.sku === 'FLT-SED-INL');
      const carb = inventory.find(i => i.sku === 'FLT-CARB-PRE');
      const post = inventory.find(i => i.sku === 'FLT-CARB-POST');

      if (spun) initialMajorParts.push({ id: spun.id, name: spun.name, category: 'filter', quantity: 1, unitPrice: spun.unitPrice, totalPrice: spun.unitPrice });
      if (sed) initialMajorParts.push({ id: sed.id, name: sed.name, category: 'filter', quantity: 1, unitPrice: sed.unitPrice, totalPrice: sed.unitPrice });
      if (carb) initialMajorParts.push({ id: carb.id, name: carb.name, category: 'filter', quantity: 1, unitPrice: carb.unitPrice, totalPrice: carb.unitPrice });
      if (post) initialMajorParts.push({ id: post.id, name: post.name, category: 'filter', quantity: 1, unitPrice: post.unitPrice, totalPrice: post.unitPrice });

      if (initialMajorParts.length === 0) {
        initialMajorParts.push(
          { id: 'p1', name: 'PP Spun Candle Filter 10"', category: 'filter', quantity: 1, unitPrice: 200, totalPrice: 200 },
          { id: 'p2', name: 'Sediment Inline Filter 10"', category: 'filter', quantity: 1, unitPrice: 400, totalPrice: 400 },
          { id: 'p3', name: 'Pre-Carbon Block Filter 10"', category: 'filter', quantity: 1, unitPrice: 450, totalPrice: 450 },
          { id: 'p4', name: 'Post-Carbon / Mineral Cartridge', category: 'filter', quantity: 1, unitPrice: 500, totalPrice: 500 }
        );
      }

      setPartsUsed(initialMajorParts);
      setRemarks('Complete Annual Overhaul: Installed all fresh inline filters and spun candle. Sanitized storage tank. TDS calibrated.');
    } else if (type === 'repair') {
      setNextDueDate(format(addMonths(baseDate, 6), 'yyyy-MM-dd'));
      setServiceCharge(400);
      setPartsUsed([]);
      setRemarks('');
    } else if (type === 'installation') {
      setNextDueDate(format(addMonths(baseDate, 6), 'yyyy-MM-dd'));
      setServiceCharge(500);
      setPartsUsed([]);
      setRemarks('New RO Purifier installation completed. Checked water pressure, inlet adapter, waste water reject ratio, and initial TDS.');
    }
  };

  // Add Part to list
  const handleAddPart = (inventoryId: string) => {
    const item = inventory.find(i => i.id === inventoryId);
    if (!item) return;

    // Check if already in list
    const existingIndex = partsUsed.findIndex(p => p.id === item.id);
    if (existingIndex !== -1) {
      const updated = [...partsUsed];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setPartsUsed(updated);
    } else {
      setPartsUsed([
        ...partsUsed,
        {
          id: item.id,
          name: item.name,
          category: item.category as any,
          quantity: 1,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice
        }
      ]);
    }
  };

  const handleUpdatePartQty = (index: number, qty: number) => {
    const updated = [...partsUsed];
    const newQty = Math.max(1, qty);
    updated[index].quantity = newQty;
    updated[index].totalPrice = newQty * updated[index].unitPrice;
    setPartsUsed(updated);
  };

  const handleUpdatePartPrice = (index: number, price: number) => {
    const updated = [...partsUsed];
    updated[index].unitPrice = price;
    updated[index].totalPrice = updated[index].quantity * price;
    setPartsUsed(updated);
  };

  const handleRemovePart = (index: number) => {
    setPartsUsed(partsUsed.filter((_, i) => i !== index));
  };

  // Calculations
  const partsCost = partsUsed.reduce((sum, p) => sum + p.totalPrice, 0);
  const totalAmount = Math.max(0, partsCost + Number(serviceCharge || 0) - Number(discount || 0));

  // Signature Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  if (!isOpen) return null;

  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || preSelectedCustomer;

  const handleSubmit = (generateInvoice: boolean = false, sendWhatsApp: boolean = false) => {
    if (!currentCustomer) {
      alert('Please select a customer.');
      return;
    }

    let signatureDataUrl: string | undefined = undefined;
    if (canvasRef.current && hasSignature) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    }

    const serviceRecordPayload = {
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      customerPhone: currentCustomer.phone,
      customerAddress: currentCustomer.address,
      roBrand: currentCustomer.roBrand,
      roModel: currentCustomer.roModel,
      serviceType,
      serviceDate,
      nextDueDate,
      technicianName: technicianName || 'Ramesh Sharma',
      partsUsed,
      partsCost,
      serviceCharge: Number(serviceCharge) || 0,
      discount: Number(discount) || 0,
      totalAmount,
      paymentStatus,
      paymentMode,
      rawWaterTds: rawWaterTds !== '' ? Number(rawWaterTds) : undefined,
      outputTds: outputTds !== '' ? Number(outputTds) : undefined,
      customerSignature: signatureDataUrl,
      beforePhotoUrl,
      afterPhotoUrl,
      remarks
    };

    onSaveService(serviceRecordPayload, generateInvoice, sendWhatsApp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                Log RO Service & Filter Replacement
              </h3>
              <p className="text-xs text-teal-200">
                Auto-schedules next due date & deducts parts from inventory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Customer Selection & Quick Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const cust = customers.find(c => c.id === e.target.value);
                    if (cust) {
                      setRawWaterTds(cust.rawWaterTds ?? '');
                      setOutputTds(cust.outputTds ?? '');
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:border-teal-500 outline-none font-semibold text-slate-800"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.roBrand} - 📞 {c.phone})
                    </option>
                  ))}
                </select>
              </div>

              {currentCustomer && (
                <div className="text-xs space-y-1 bg-white p-3 rounded-xl border border-slate-200/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Purifier:</span>
                    <span className="font-bold text-teal-800">{currentCustomer.roBrand} - {currentCustomer.roModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="text-slate-700 truncate max-w-[200px]">{currentCustomer.address}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Service Type Selector (The Core Logic) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Service Type (Auto-configures parts & next due date)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleServiceTypeChange('small')}
                className={`p-3 rounded-2xl border text-left transition ${
                  serviceType === 'small'
                    ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-teal-900">Small Service</div>
                <p className="text-[11px] text-teal-700 mt-0.5">PP Spun Candle</p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-bold">
                  Next Due: +6 Mos
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceTypeChange('major')}
                className={`p-3 rounded-2xl border text-left transition ${
                  serviceType === 'major'
                    ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-purple-900">Major Service</div>
                <p className="text-[11px] text-purple-700 mt-0.5">Sediment + Carbon + Spun</p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">
                  Next Due: +12 Mos
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceTypeChange('repair')}
                className={`p-3 rounded-2xl border text-left transition ${
                  serviceType === 'repair'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-amber-900">Repair / Spares</div>
                <p className="text-[11px] text-amber-700 mt-0.5">Pump / Membrane / SMPS / SV</p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                  Custom Spares
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleServiceTypeChange('installation')}
                className={`p-3 rounded-2xl border text-left transition ${
                  serviceType === 'installation'
                    ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm text-blue-900">New Installation</div>
                <p className="text-[11px] text-blue-700 mt-0.5">Machine Setup</p>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">
                  Commissioning
                </span>
              </button>
            </div>
          </div>

          {/* Section 3: Date, Technician & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Date
              </label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician Name
              </label>
              <select
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.name}>{t.name} ({t.specialty || 'RO Tech'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Service Due Date
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-teal-50 border border-teal-300 font-semibold text-teal-900 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Section 4: Spare Parts Used & Inventory Deductions */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Spare Parts Used / Replaced
                </h4>
                <p className="text-[11px] text-slate-500">Auto-deducted from your inventory upon saving</p>
              </div>

              {/* Quick Part Adder from Inventory */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  id="part-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddPart(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-teal-500 outline-none"
                >
                  <option value="">+ Add Spare Part from Stock</option>
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (Stock: {inv.currentStock}, Rs. {inv.unitPrice})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parts List Table */}
            {partsUsed.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                No parts selected yet. (Routine service only)
              </div>
            ) : (
              <div className="space-y-2">
                {partsUsed.map((part, index) => (
                  <div key={index} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800">{part.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) => handleUpdatePartQty(index, Number(e.target.value))}
                          className="w-12 px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded font-semibold"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Price:</span>
                        <input
                          type="number"
                          value={part.unitPrice}
                          onChange={(e) => handleUpdatePartPrice(index, Number(e.target.value))}
                          className="w-16 px-1.5 py-1 text-right bg-slate-50 border border-slate-200 rounded font-semibold"
                        />
                      </div>

                      <span className="font-bold text-slate-900 w-16 text-right">
                        Rs. {part.totalPrice}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemovePart(index)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: TDS Calibration & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                TDS Readings (ppm)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Raw Input TDS"
                  value={rawWaterTds}
                  onChange={(e) => setRawWaterTds(e.target.value === '' ? '' : Number(e.target.value))}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white"
                />
                <input
                  type="number"
                  placeholder="Purified Output TDS"
                  value={outputTds}
                  onChange={(e) => setOutputTds(e.target.value === '' ? '' : Number(e.target.value))}
                  className="px-3 py-2 text-xs bg-emerald-50 border border-emerald-300 font-bold text-emerald-800 rounded-xl outline-none focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technician Notes / Remarks
              </label>
              <input
                type="text"
                placeholder="Work done summary, pressure check, etc."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white"
              />
            </div>
          </div>

          {/* Section 6: Financials, Payment & Customer Signature Canvas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: Financial Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Parts Subtotal:</span>
                <span className="font-semibold text-slate-800">Rs. {partsCost}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Service / Labor Charge:</span>
                <input
                  type="number"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right bg-white border border-slate-300 rounded font-semibold text-xs"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Discount Applied:</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right bg-white border border-slate-300 rounded font-semibold text-xs text-red-600"
                />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-sm text-slate-900">Total Amount:</span>
                <span className="font-extrabold text-base text-teal-700">Rs. {totalAmount}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full py-1 px-2 text-xs bg-white border border-slate-300 rounded font-semibold"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="w-full py-1 px-2 text-xs bg-white border border-slate-300 rounded font-semibold"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="card">Debit/Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right: Digital Signature Pad */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <PenTool className="w-3.5 h-3.5 text-teal-600" />
                  Customer Digital Signature
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] text-slate-400 hover:text-red-600"
                >
                  Clear
                </button>
              </div>

              <div className="border border-slate-300 rounded-xl bg-white overflow-hidden my-1 touch-none">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={90}
                  className="w-full h-[90px] cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <span className="text-[10px] text-slate-400 text-center">
                Sign above using touch screen, mouse, or stylus
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Triggers */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(true, false)}
              className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Save & Generate Invoice PDF</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false, true)}
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Save & Send WhatsApp Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false, false)}
              className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
