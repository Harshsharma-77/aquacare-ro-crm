'use client';

import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  Download,
  TrendingUp,
  Boxes,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';
import { InventoryItem } from '@/types';
import { formatCurrency, formatDateSafe } from '@/lib/utils';
import { exportInventoryToExcel } from '@/lib/excelExport';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onSaveItem: (item: Partial<InventoryItem> & { name: string; unitPrice: number }) => void;
  onUpdateStock: (itemId: string, delta: number) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  onSaveItem,
  onUpdateStock
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryItem['category']>('filter');
  const [sku, setSku] = useState('');
  const [currentStock, setCurrentStock] = useState<number>(10);
  const [minStockLevel, setMinStockLevel] = useState<number>(5);
  const [costPrice, setCostPrice] = useState<number>(100);
  const [unitPrice, setUnitPrice] = useState<number>(250);
  const [description, setDescription] = useState('');

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setCategory(item.category);
      setSku(item.sku);
      setCurrentStock(item.currentStock);
      setMinStockLevel(item.minStockLevel);
      setCostPrice(item.costPrice);
      setUnitPrice(item.unitPrice);
      setDescription(item.description || '');
    } else {
      setEditingItem(null);
      setName('');
      setCategory('filter');
      setSku(`SKU-${Date.now().toString().slice(-4)}`);
      setCurrentStock(10);
      setMinStockLevel(5);
      setCostPrice(100);
      setUnitPrice(250);
      setDescription('');
    }
    setIsAddModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveItem({
      id: editingItem?.id,
      name: name.trim(),
      category,
      sku: sku.trim(),
      currentStock: Number(currentStock) || 0,
      minStockLevel: Number(minStockLevel) || 5,
      costPrice: Number(costPrice) || 0,
      unitPrice: Number(unitPrice) || 0,
      description: description.trim()
    });

    setIsAddModalOpen(false);
  };

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      return true;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const lowStockCount = useMemo(() => {
    return inventory.filter(i => i.currentStock <= i.minStockLevel).length;
  }, [inventory]);

  const totalStockValue = useMemo(() => {
    return inventory.reduce((sum, i) => sum + (i.currentStock * i.costPrice), 0);
  }, [inventory]);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            RO Spare Parts & Filter Inventory
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time stock tracking for Booster Pumps, Membranes, SMPS, Solenoid Valves, and Filter Cartridges.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => exportInventoryToExcel(filteredItems)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Inventory (Excel)</span>
          </button>

          <button
            onClick={() => openModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-teal-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Spare Part</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total SKUs in Catalog</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{inventory.length} Parts</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Low Stock Alerts</span>
          <div className={`text-2xl font-extrabold mt-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {lowStockCount} Parts Low
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Inventory Valuation</span>
          <div className="text-2xl font-extrabold text-teal-700 mt-1">{formatCurrency(totalStockValue)}</div>
        </div>
      </div>

      {/* Search & Category Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search parts by name, SKU, category, or specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none transition"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-teal-500 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="filter">Filter Cartridges & Spun</option>
              <option value="membrane">RO Membranes (75/100 GPD)</option>
              <option value="electrical">Electrical (Booster Pump, SMPS, SV)</option>
              <option value="fittings">Fittings, Taps & FR</option>
              <option value="body">Body, Tanks & Clamps</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Part Details & Category</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4 text-center">Stock Level</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">Quick Stock Adjust</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const isLow = item.currentStock <= item.minStockLevel;
                return (
                  <tr key={item.id} className="hover:bg-teal-50/30 transition">
                    {/* Name & Category */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{item.name}</div>
                      <div className="text-[11px] text-slate-500">{item.description}</div>
                      <span className="inline-block mt-1 text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {item.category}
                      </span>
                    </td>

                    {/* SKU */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {item.sku}
                    </td>

                    {/* Current Stock */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          isLow
                            ? 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.currentStock} in stock
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">Min threshold: {item.minStockLevel}</div>
                    </td>

                    {/* Cost & Retail Price */}
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      Rs. {item.costPrice}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      Rs. {item.unitPrice}
                    </td>

                    {/* Quick Stock Buttons */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onUpdateStock(item.id, -1)}
                          disabled={item.currentStock <= 0}
                          className="w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 disabled:opacity-40"
                          title="Minus 1"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-xs">{item.currentStock}</span>
                        <button
                          onClick={() => onUpdateStock(item.id, 1)}
                          className="w-7 h-7 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-lg font-bold"
                          title="Add 1"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onUpdateStock(item.id, 10)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] rounded-lg font-semibold text-slate-600"
                          title="Add Box (+10)"
                        >
                          +10
                        </button>
                      </div>
                    </td>

                    {/* Edit */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openModal(item)}
                        className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingItem ? 'Edit Spare Part' : 'Add New Spare Part to Inventory'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Part Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Booster Pump 100 GPD Copper"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  >
                    <option value="filter">Filter</option>
                    <option value="membrane">Membrane</option>
                    <option value="electrical">Electrical</option>
                    <option value="fittings">Fittings</option>
                    <option value="body">Body</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Stock Quantity</label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    value={minStockLevel}
                    onChange={(e) => setMinStockLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase / Cost Price (Rs)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Retail Selling Price (Rs)</label>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Compatibility</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Fits Kent Grand Plus, Aquaguard Enhance, Pureit"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 text-white font-bold rounded-xl shadow-md"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
