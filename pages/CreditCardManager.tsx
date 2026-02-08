import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Account, CreditCardBill } from '../types';
import SidePopover from '../components/SidePopover';
import { ICONS } from '../constants';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';

const CreditCardManager: React.FC = () => {
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { addToast } = useToast();

  // Form State
  const [cardId, setCardId] = useState('');
  const [billMonth, setBillMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [status, setStatus] = useState<'paid' | 'partial' | 'unpaid'>('unpaid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [fetchedBills, fetchedAccounts] = await Promise.all([
      storage.getBills(),
      storage.getAccounts()
    ]);
    setBills(fetchedBills);
    setAccounts(fetchedAccounts.filter(a => a.type === 'credit'));
    setLoading(false);
  };

  const resetForm = () => {
    setCardId('');
    setBillMonth(new Date().toISOString().slice(0, 7));
    setPaidAmount('');
    setPaymentDate('');
    setStatus('unpaid');
    setEditingId(null);
    setShowAdd(false);
  };

  const handleEdit = (bill: CreditCardBill) => {
    setEditingId(bill.id);
    setCardId(bill.cardId);
    setBillMonth(bill.month);
    setPaidAmount(bill.paidAmount.toString());
    setPaymentDate(bill.paymentDate || '');
    setStatus(bill.status);
    setShowAdd(true);
  };

  const isValid = cardId && billMonth && parseFloat(paidAmount) > 0 && paymentDate;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    // Duplicate Check
    if (!editingId) {
        const exists = bills.find(b => b.cardId === cardId && b.month === billMonth);
        if (exists) {
            addToast(`A bill record for this card and month already exists.`, 'error');
            return;
        }
    }

    const newBill: CreditCardBill = {
        id: editingId || crypto.randomUUID(),
        cardId,
        month: billMonth,
        paidAmount: parseFloat(paidAmount) || 0,
        paymentDate: paymentDate || undefined,
        status,
        notes: ''
    };

    try {
        await storage.saveBill(newBill);
        
        if (editingId) {
            setBills(prev => prev.map(b => b.id === newBill.id ? newBill : b));
            addToast('Bill record updated successfully', 'success');
        } else {
            setBills(prev => [newBill, ...prev]);
            addToast('Bill record added successfully', 'success');
        }
        resetForm();
    } catch (error) {
        console.error("Failed to save bill", error);
        addToast('Failed to save bill record. Please try again.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this bill record?")) return;
    try {
        await storage.deleteBill(id);
        setBills(prev => prev.filter(b => b.id !== id));
        addToast('Bill record deleted', 'success');
    } catch (error) {
        addToast('Failed to delete bill record.', 'error');
    }
  };

  // Derived Data
  const filteredBills = bills.filter(b => b.month === selectedMonth);
  const totalPaid = filteredBills.reduce((sum, b) => sum + b.paidAmount, 0);
  const statusCounts = {
      paid: filteredBills.filter(b => b.status === 'paid').length,
      partial: filteredBills.filter(b => b.status === 'partial').length,
      unpaid: filteredBills.filter(b => b.status === 'unpaid').length
  };

  // Stats per Card
  const getCardStats = (accId: string) => {
      const cardBills = bills.filter(b => b.cardId === accId);
      const totalPaid = cardBills.reduce((sum, b) => sum + b.paidAmount, 0);
      const avgPayment = cardBills.length > 0 ? cardBills.reduce((sum, b) => sum + b.paidAmount, 0) / cardBills.length : 0;
      const onTime = cardBills.filter(b => b.status === 'paid').length;
      const missed = cardBills.filter(b => b.status !== 'paid').length;
      const highest = cardBills.reduce((max, b) => Math.max(max, b.paidAmount), 0);
      
      return { totalPaid, avgPayment, onTime, missed, highest };
  };

  if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto space-y-8">
      
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight uppercase">Credit Card Ledger</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Track Bills & Payments</p>
        </div>
        <div className="flex items-center gap-4">
            <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all hover:border-slate-300 w-auto"
            />
            <button onClick={() => setShowAdd(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                <ICONS.Plus className="w-4 h-4" />
                <span>Record Bill</span>
            </button>
        </div>
      </div>

      {/* Month Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60 mb-1">Total Paid ({selectedMonth})</p>
              <p className="text-3xl font-bold text-emerald-900">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="card-professional p-6 bg-white border-slate-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Status Breakdown</p>
              <div className="flex gap-4">
                  <div className="text-center">
                      <span className="block text-xl font-black text-emerald-600">{statusCounts.paid}</span>
                      <span className="text-[9px] font-bold uppercase text-slate-400">Paid</span>
                  </div>
                  <div className="text-center">
                      <span className="block text-xl font-black text-amber-500">{statusCounts.partial}</span>
                      <span className="text-[9px] font-bold uppercase text-slate-400">Partial</span>
                  </div>
                  <div className="text-center">
                      <span className="block text-xl font-black text-rose-500">{statusCounts.unpaid}</span>
                      <span className="text-[9px] font-bold uppercase text-slate-400">Unpaid</span>
                  </div>
              </div>
          </div>
      </div>

      {/* Ledger Table */}
      <div className="card-professional bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="py-4 pl-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Card</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Month</th>
                        <th className="py-4 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Paid</th>
                        <th className="py-4 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="py-4 pr-6 w-20"></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBills.length === 0 ? (
                        <tr><td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">No bills recorded for this month.</td></tr>
                    ) : (
                        filteredBills.map(bill => {
                            const acc = accounts.find(a => a.id === bill.cardId);
                            return (
                                <tr key={bill.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-6 font-bold text-slate-800 text-sm">{acc?.name || 'Unknown Card'}</td>
                                    <td className="py-4 px-4 font-medium text-xs text-slate-500">{bill.month}</td>
                                    <td className="py-4 px-4 text-right font-bold text-emerald-600">{formatCurrency(bill.paidAmount)}</td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                                            bill.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            bill.status === 'partial' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
                                        }`}>
                                            {bill.status}
                                        </span>
                                    </td>
                                    <td className="py-4 pr-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(bill)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button onClick={() => handleDelete(bill.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                <ICONS.Trash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>

       {/* Card Insights Grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8 border-t border-slate-200">
           {accounts.map(acc => {
               const stats = getCardStats(acc.id);
               if (stats.totalPaid === 0 && stats.avgPayment === 0) return null; // Hide unused cards from insights

               return (
                   <div key={acc.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                       <div className="flex justify-between items-start mb-4">
                           <div>
                               <h3 className="font-bold text-slate-800">{acc.name}</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Stats</p>
                           </div>
                           <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                               <ICONS.Chart className="w-4 h-4" />
                           </div>
                       </div>
                       <div className="space-y-3">
                           <div className="flex justify-between text-xs">
                               <span className="text-slate-500 font-bold">Avg Payment</span>
                               <span className="font-bold text-slate-800">{formatCurrency(stats.avgPayment)}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                               <span className="text-slate-500 font-bold">Highest Payment</span>
                               <span className="font-bold text-slate-800">{formatCurrency(stats.highest)}</span>
                           </div>
                            <div className="flex justify-between text-xs">
                               <span className="text-slate-500 font-bold">Total Paid</span>
                               <span className="font-bold text-emerald-600">{formatCurrency(stats.totalPaid)}</span>
                           </div>
                           <div className="pt-3 border-t border-slate-50 flex items-center gap-2">
                               <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Consistency:</span>
                               <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-emerald-500" style={{ width: `${(stats.onTime / (stats.onTime + (stats.missed || 1))) * 100}%` }}></div>
                               </div>
                           </div>
                       </div>
                   </div>
               );
           })}
       </div>

      {/* Add/Edit Side Popover */}
      <SidePopover
        isOpen={showAdd}
        onClose={resetForm}
        title={editingId ? "Edit Ledger Record" : "Record Bill Payment"}
        subtitle="Manage Monthly Credit Card Statement"
      >
        <form onSubmit={handleSave} className="space-y-6">
            <div>
                <label className="label-professional">Credit Card</label>
                <select 
                    value={cardId} 
                    onChange={e => setCardId(e.target.value)}
                    required
                    className="input-professional"
                >
                    <option value="">Select Card</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.lastFour || 'XXXX'})</option>)}
                </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="label-professional">Billing Month</label>
                    <input 
                        type="month" 
                        value={billMonth} 
                        onChange={e => setBillMonth(e.target.value)}
                        required
                        className="input-professional"
                    />
                </div>
                 <div>
                    <label className="label-professional">Payment Date</label>
                    <input 
                        type="date" 
                        value={paymentDate} 
                        onChange={e => setPaymentDate(e.target.value)}
                        className="input-professional"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                 <div>
                     <label className="label-professional">Amount Paid</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input 
                            type="number" 
                            step="0.01"
                            value={paidAmount}
                            onChange={e => setPaidAmount(e.target.value)}
                            required
                            className="input-professional !pl-8"
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

             <div>
                <label className="label-professional">Payment Status</label>
                <div className="grid grid-cols-3 gap-3">
                    {['paid', 'partial', 'unpaid'].map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setStatus(s as any)}
                            className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider border transition-all ${
                                status === s 
                                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="pt-8 flex gap-4">
                 <button type="button" onClick={resetForm} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Cancel</button>
                 <button 
                    type="submit" 
                    disabled={!isValid}
                    className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200"
                 >
                    {editingId ? "Update Record" : "Save Record"}
                </button>
            </div>
        </form>
      </SidePopover>
    </div>
  );
};

export default CreditCardManager;
