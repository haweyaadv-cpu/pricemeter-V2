/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  RefreshCw, 
  Ruler, 
  Box, 
  DollarSign, 
  Info, 
  CheckCircle2, 
  Trash2, 
  Download, 
  Moon, 
  Sun, 
  Plus, 
  History,
  Edit2
} from 'lucide-react';
import { DEFAULT_MATERIALS } from './constants';
import { CalculationResult, Unit } from './types';

export default function App() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('printing-calculator-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  // Input states
  const [length, setLength] = useState<string>('');
  const [width, setWidth] = useState<string>('');
  const [unit, setUnit] = useState<Unit>('m');
  const [materialId, setMaterialId] = useState<string>(DEFAULT_MATERIALS[0].id);
  const [pricePerSqm, setPricePerSqm] = useState<string>(DEFAULT_MATERIALS[0].pricePerSqm.toString());
  const [installationCost, setInstallationCost] = useState<string>('0');
  const [installationType, setInstallationType] = useState<'fixed' | 'perSqm'>('fixed');
  
  // History state
  const [history, setHistory] = useState<CalculationResult[]>(() => {
    const saved = localStorage.getItem('printing-calculator-history');
    return saved ? JSON.parse(saved) : [];
  });

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persist dark mode
  useEffect(() => {
    localStorage.setItem('printing-calculator-dark-mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist history
  useEffect(() => {
    localStorage.setItem('printing-calculator-history', JSON.stringify(history));
  }, [history]);

  // Auto-fill price when material changes
  useEffect(() => {
    const material = DEFAULT_MATERIALS.find(m => m.id === materialId);
    if (material && material.id !== 'custom') {
      setPricePerSqm(material.pricePerSqm.toString());
    }
  }, [materialId]);

  // Unit conversion to meters
  const convertToMeters = (val: number, fromUnit: Unit): number => {
    switch (fromUnit) {
      case 'cm': return val / 100;
      case 'mm': return val / 1000;
      default: return val;
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const l = parseFloat(length);
    const w = parseFloat(width);
    const p = parseFloat(pricePerSqm);
    const i = parseFloat(installationCost);

    // Validation
    if (isNaN(l) || l <= 0 || isNaN(w) || w <= 0) {
      setError('يرجى إدخال أبعاد صحيحة (أكبر من صفر)');
      return;
    }
    if (isNaN(p) || p < 0) {
      setError('يرجى إدخال سعر صحيح للمتر المربع');
      return;
    }
    if (isNaN(i) || i < 0) {
      setError('يرجى إدخال تكلفة تركيب صحيحة');
      return;
    }

    // Convert to meters for area calculation
    const lMeters = convertToMeters(l, unit);
    const wMeters = convertToMeters(w, unit);
    const area = lMeters * wMeters;
    const printingCost = area * p;
    const actualInstallationCost = installationType === 'perSqm' ? area * i : i;
    const totalPrice = printingCost + actualInstallationCost;

    const material = DEFAULT_MATERIALS.find(m => m.id === materialId);
    
    const newEntry: CalculationResult = {
      id: editingId || crypto.randomUUID(),
      length: l,
      width: w,
      unit,
      area,
      pricePerSqm: p,
      printingCost,
      installationCost: actualInstallationCost,
      totalPrice,
      materialName: material?.name || 'مخصص',
      timestamp: Date.now()
    };

    if (editingId) {
      setHistory(prev => prev.map(item => item.id === editingId ? newEntry : item));
      setEditingId(null);
    } else {
      setHistory(prev => [newEntry, ...prev]);
    }

    // Reset inputs for next entry
    handleReset();
  };

  const handleReset = () => {
    setLength('');
    setWidth('');
    setUnit('m');
    setMaterialId(DEFAULT_MATERIALS[0].id);
    setPricePerSqm(DEFAULT_MATERIALS[0].pricePerSqm.toString());
    setInstallationCost('0');
    setInstallationType('fixed');
    setEditingId(null);
    setError(null);
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleEdit = (item: CalculationResult) => {
    setEditingId(item.id);
    setLength(item.length.toString());
    setWidth(item.width.toString());
    setUnit(item.unit);
    setPricePerSqm(item.pricePerSqm.toString());
    setInstallationCost(item.installationCost.toString());
    // Note: We don't store installationType in result, but we can infer if it was perSqm
    // For simplicity, we'll keep the current type or let user re-select
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportToCSV = () => {
    if (history.length === 0) return;
    
    const headers = ['الطول', 'العرض', 'الوحدة', 'المساحة (م2)', 'سعر المتر', 'تكلفة الطباعة', 'تكلفة التركيب', 'الإجمالي'];
    const rows = history.map(item => [
      item.length,
      item.width,
      item.unit,
      item.area.toFixed(2),
      item.pricePerSqm,
      item.printingCost.toFixed(2),
      item.installationCost.toFixed(2),
      item.totalPrice.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `printing_calculations_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const grandTotal = history.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans p-4 md:p-8`} dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
              <Calculator size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">حاسبة تكلفة الطباعة</h1>
              <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>النسخة المتقدمة مع سجل العمليات</p>
            </div>
          </motion.div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-2xl transition-all ${darkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-white text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-200'}`}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Form */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`lg:col-span-4 p-6 md:p-8 rounded-3xl shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              {editingId ? <Edit2 size={20} className="text-blue-500" /> : <Plus size={20} className="text-blue-500" />}
              {editingId ? 'تعديل العملية' : 'إضافة عملية جديدة'}
            </h2>

            <form onSubmit={handleCalculate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Ruler size={16} className="text-blue-500" />
                  وحدة القياس
                </label>
                <div className={`flex p-1 rounded-xl transition-colors ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  {(['m', 'cm', 'mm'] as Unit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnit(u)}
                      className={`flex-1 py-2 text-sm rounded-lg transition-all ${unit === u ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'}`}
                    >
                      {u === 'm' ? 'متر' : u === 'cm' ? 'سم' : 'ملم'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">الطول</label>
                  <input
                    type="number"
                    step="0.01"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 rounded-xl outline-none transition-all border focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-700 border-slate-600 focus:border-transparent' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">العرض</label>
                  <input
                    type="number"
                    step="0.01"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-3 rounded-xl outline-none transition-all border focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-700 border-slate-600 focus:border-transparent' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Box size={16} className="text-blue-500" />
                  نوع الخامة
                </label>
                <select
                  value={materialId}
                  onChange={(e) => setMaterialId(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl outline-none appearance-none transition-all border focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}
                >
                  {DEFAULT_MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-500" />
                  سعر المتر المربع (ر.س)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pricePerSqm}
                  onChange={(e) => setPricePerSqm(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl outline-none transition-all border focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold">تكلفة التركيب</label>
                  <div className={`flex p-1 rounded-lg transition-colors ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <button
                      type="button"
                      onClick={() => setInstallationType('fixed')}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${installationType === 'fixed' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'}`}
                    >
                      مبلغ ثابت
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallationType('perSqm')}
                      className={`px-3 py-1 text-xs rounded-md transition-all ${installationType === 'perSqm' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'}`}
                    >
                      لكل متر
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={installationCost}
                  onChange={(e) => setInstallationCost(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl outline-none transition-all border focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2"
                  >
                    <Info size={16} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  {editingId ? 'تحديث العملية' : 'إضافة للجدول'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className={`px-6 font-bold py-4 rounded-2xl transition-all active:scale-95 ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  title="إعادة تعيين"
                >
                  <RefreshCw size={20} />
                </button>
              </div>
            </form>
          </motion.div>

          {/* History Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className={`p-6 md:p-8 rounded-3xl shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History size={24} className="text-blue-500" />
                  سجل العمليات
                </h2>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={exportToCSV}
                    disabled={history.length === 0}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${history.length === 0 ? 'opacity-50 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20'}`}
                  >
                    <Download size={18} />
                    تصدير CSV
                  </button>
                  <button
                    onClick={() => setHistory([])}
                    disabled={history.length === 0}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all ${history.length === 0 ? 'opacity-50 cursor-not-allowed' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-800'}`}
                  >
                    <Trash2 size={18} />
                    مسح الكل
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                      <th className="py-4 px-2 text-sm font-bold text-slate-500">الأبعاد</th>
                      <th className="py-4 px-2 text-sm font-bold text-slate-500">المساحة</th>
                      <th className="py-4 px-2 text-sm font-bold text-slate-500">الخامة</th>
                      <th className="py-4 px-2 text-sm font-bold text-slate-500">التكلفة</th>
                      <th className="py-4 px-2 text-sm font-bold text-slate-500">الإجمالي</th>
                      <th className="py-4 px-2 text-sm font-bold text-slate-500">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {history.map((item) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`border-b transition-colors ${darkMode ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-50 hover:bg-slate-50'}`}
                        >
                          <td className="py-4 px-2">
                            <div className="text-sm font-medium">{item.length} × {item.width}</div>
                            <div className="text-[10px] text-slate-400 uppercase">{item.unit === 'm' ? 'متر' : item.unit === 'cm' ? 'سم' : 'ملم'}</div>
                          </td>
                          <td className="py-4 px-2 text-sm">{item.area.toFixed(2)} م²</td>
                          <td className="py-4 px-2 text-sm truncate max-w-[100px]">{item.materialName}</td>
                          <td className="py-4 px-2">
                            <div className="text-xs text-slate-400">طباعة: {item.printingCost.toFixed(2)}</div>
                            <div className="text-xs text-slate-400">تركيب: {item.installationCost.toFixed(2)}</div>
                          </td>
                          <td className="py-4 px-2 font-bold text-blue-600 dark:text-blue-400">{item.totalPrice.toFixed(2)} ر.س</td>
                          <td className="py-4 px-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-600 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`}
                                title="تعديل"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                                title="حذف"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                          لا توجد عمليات مسجلة حالياً
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {history.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                      <div className="text-xs text-slate-500 mb-1">عدد العمليات</div>
                      <div className="text-xl font-bold">{history.length}</div>
                    </div>
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                      <div className="text-xs text-slate-500 mb-1">إجمالي المساحة</div>
                      <div className="text-xl font-bold">{history.reduce((sum, i) => sum + i.area, 0).toFixed(2)} م²</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 w-full md:w-auto min-w-[250px]">
                    <span className="block text-blue-100 text-sm mb-1">الإجمالي الكلي لجميع العمليات</span>
                    <span className="text-4xl font-black">{grandTotal.toFixed(2)} ر.س</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Tips */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`p-6 rounded-2xl border transition-colors ${darkMode ? 'bg-amber-900/10 border-amber-900/30 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-800'}`}
            >
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <Info size={18} />
                نصائح الاستخدام
              </h3>
              <ul className={`text-sm space-y-2 list-disc list-inside ${darkMode ? 'text-amber-300/70' : 'text-amber-700'}`}>
                <li>يمكنك تغيير وحدة القياس (سم، ملم، متر) وسيتم التحويل تلقائياً للمتر المربع.</li>
                <li>يتم حفظ سجل العمليات تلقائياً في متصفحك للرجوع إليها لاحقاً.</li>
                <li>استخدم زر التصدير لتحميل السجل كملف CSV لفتحه في Excel.</li>
                <li>يمكنك تعديل أي عملية سابقة بالضغط على أيقونة القلم في الجدول.</li>
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-400 text-sm pb-8">
          <p>© {new Date().getFullYear()} نظام حساب تكاليف الطباعة الرقمية المطور</p>
        </footer>
      </div>
    </div>
  );
}
