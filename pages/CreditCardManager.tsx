import React, { useState, useEffect, useMemo } from 'react';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { CustomDateRangePicker } from '../components/ui/CustomDateRangePicker';
import { storage } from '../services/storage';
import { Account, CreditCardBill } from '../types';
import SidePopover from '../components/SidePopover';
import { ICONS } from '../constants';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';
import { AppCard } from '../components/ui/AppCard';
import { 
    ResponsiveContainer, 
    AreaChart, 
    Area, 
    CartesianGrid, 
    XAxis, 
    YAxis, 
    Tooltip, 
    PieChart, 
    Pie, 
    Cell, 
    Legend 
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#f43f5e']; // Paid, Partial, Unpaid

const CreditCardManager: React.FC = () => {
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { addToast } = useToast();

  // Filter State
  const [timeFilter, setTimeFilter] = useState<'all' | 'this-month' | 'last-month' | 'this-year' | 'custom'>('this-month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State
  const [cardId, setCardId] = useState('');
  const [billMonth, setBillMonth] = useState(new Date().toISOString().slice(0, 7));
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
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
    setPaymentDate(new Date().toISOString().split('T')[0]);
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
    
    // Duplicate Check logic can be enhanced if needed, currently checking for exact month/card duplicate when creating new
    if (!editingId) {
        const exists = bills.find(b => b.cardId === cardId && b.month === billMonth);
        if (exists) {
            if(!window.confirm("A bill for this card and month already exists. Do you want to record another payment?")) {
                return;
            }
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

  // --- FILTERING & ANALYTICS ---

  const filteredBills = useMemo(() => {
    const now = new Date();
    return bills.filter(bill => {
        if (!bill.paymentDate) return false; // Or handle bills without payment date differently?
        
        const billDate = new Date(bill.paymentDate);
        
        if (timeFilter === 'this-month') {
            return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'last-month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            return billDate.getMonth() === lastMonth.getMonth() && billDate.getFullYear() === lastMonth.getFullYear();
        } else if (timeFilter === 'this-year') {
            return billDate.getFullYear() === now.getFullYear();
        } else if (timeFilter === 'custom') {
            if (startDate && bill.paymentDate < startDate) return false;
            if (endDate && bill.paymentDate > endDate) return false;
            return true;
        }
        return true; // 'all'
    });
  }, [bills, timeFilter, startDate, endDate]);

  const metrics = useMemo(() => {
      const totalPaid = filteredBills.reduce((sum, b) => sum + b.paidAmount, 0);
      const outstanding = filteredBills.filter(b => b.status === 'unpaid' || b.status === 'partial').length;
      const highestPayment = filteredBills.reduce((max, b) => Math.max(max, b.paidAmount), 0);
      const averagePayment = filteredBills.length > 0 ? totalPaid / filteredBills.length : 0;
      
      const statusData = [
          { name: 'Paid', value: filteredBills.filter(b => b.status === 'paid').length },
          { name: 'Partial', value: filteredBills.filter(b => b.status === 'partial').length },
          { name: 'Unpaid', value: filteredBills.filter(b => b.status === 'unpaid').length }
      ].filter(d => d.value > 0);

      // Trend Data (Group by Month)
      const trendMap = new Map<string, number>();
      filteredBills.forEach(b => {
          if (!b.paymentDate) return;
          const monthKey = b.paymentDate.slice(0, 7); // YYYY-MM
          trendMap.set(monthKey, (trendMap.get(monthKey) || 0) + b.paidAmount);
      });
      
      const trendData = Array.from(trendMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, amount]) => ({
            name: new Date(date + '-01').toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
            value: amount,
            fullDate: date
        }));

      return { totalPaid, outstanding, highestPayment, averagePayment, statusData, trendData };
  }, [filteredBills]);

  const getCardStats = (accId: string) => {
      // Stats should arguably reflect the filtered period OR lifetime. 
      // User request "Lifetime Stats" labels in code implies lifetime, 
      // but typically dashboards filter everything. Let's filter by the selected range for consistency with the page.
      const cardBills = filteredBills.filter(b => b.cardId === accId);
      
      const totalPaid = cardBills.reduce((sum, b) => sum + b.paidAmount, 0);
      const avgPayment = cardBills.length > 0 ? totalPaid / cardBills.length : 0;
      const onTime = cardBills.filter(b => b.status === 'paid').length;
      const missed = cardBills.filter(b => b.status !== 'paid').length;
      const highest = cardBills.reduce((max, b) => Math.max(max, b.paidAmount), 0);
      
      return { totalPaid, avgPayment, onTime, missed, highest };
  };

  if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto space-y-8">
      
      {/* Header & Filter */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <ICONS.Cards className="w-6 h-6 text-blue-600" />
            Credit Card Ledger
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1 ml-8">Track Bills & Payments</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
            {/* Time Filters */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                {[
                  { id: 'this-month', label: 'This Month' },
                  { id: 'last-month', label: 'Last Month' },
                  { id: 'this-year', label: 'This Year' },
                  { id: 'all', label: 'All Time' },
                  { id: 'custom', label: 'Custom' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTimeFilter(opt.id as any)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                      timeFilter === opt.id 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
            </div>

             {/* Custom Range */}
             {timeFilter === 'custom' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <CustomDateRangePicker 
                        startDate={startDate}
                        endDate={endDate}
                        onRangeChange={(start, end) => {
                            setStartDate(start);
                            setEndDate(end);
                        }}
                        className="w-64"
                    />
                </div>
             )}

            <button onClick={() => setShowAdd(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                <ICONS.Plus className="w-4 h-4" />
                <span>Record Bill</span>
            </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {/* Metric 1 */}
           <AppCard className="p-5 border-emerald-100 bg-emerald-50/30">
               <div className="flex justify-between items-start">
                   <div>
                       <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-1">Total Paid</p>
                       <p className="text-2xl font-black text-emerald-900">{formatCurrency(metrics.totalPaid)}</p>
                   </div>
                   <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                       <ICONS.Wallet className="w-5 h-5" />
                   </div>
               </div>
           </AppCard>

           {/* Metric 2 */}
           <AppCard className="p-5 border-blue-100 bg-blue-50/30">
               <div className="flex justify-between items-start">
                   <div>
                       <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-1">Avg Payment</p>
                       <p className="text-2xl font-black text-blue-900">{formatCurrency(metrics.averagePayment)}</p>
                   </div>
                   <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                       <ICONS.Chart className="w-5 h-5" />
                   </div>
               </div>
           </AppCard>

           {/* Metric 3 */}
           <AppCard className="p-5 border-amber-100 bg-amber-50/30">
               <div className="flex justify-between items-start">
                   <div>
                       <p className="text-amber-600 text-[10px] font-bold uppercase tracking-widest mb-1">Outstanding</p>
                       <p className="text-2xl font-black text-amber-900">{metrics.outstanding} <span className="text-base font-bold text-amber-700/60">Bills</span></p>
                   </div>
                   <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                       <ICONS.Alert className="w-5 h-5" />
                   </div>
               </div>
           </AppCard>

            {/* Metric 4 */}
            <AppCard className="p-5 border-indigo-100 bg-indigo-50/30">
               <div className="flex justify-between items-start">
                   <div>
                       <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-1">Highest Pay</p>
                       <p className="text-2xl font-black text-indigo-900">{formatCurrency(metrics.highestPayment)}</p>
                   </div>
                   <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                       <ICONS.TrendingUp className="w-5 h-5" />
                   </div>
               </div>
           </AppCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="lg:col-span-2">
              <AppCard className="p-6 h-[350px] flex flex-col">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Payment Activity Trend</h3>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                            <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}} 
                                tickFormatter={(value) => `₹${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                            />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: '#fff', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0', 
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                                formatter={(value: number) => [formatCurrency(value), 'Paid']}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#10b981" 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorPaid)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                  </div>
              </AppCard>
          </div>

          {/* Status Chart */}
          <div>
              <AppCard className="p-6 h-[350px] flex flex-col">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Status Breakdown</h3>
                  <div className="flex-1 w-full min-h-0 relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={metrics.statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {metrics.statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name === 'Paid' ? '#10b981' : entry.name === 'Partial' ? '#f59e0b' : '#f43f5e'} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: '#fff', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            />
                            <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconType="circle"
                                wrapperStyle={{fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase'}}
                            />
                        </PieChart>
                     </ResponsiveContainer>
                     {/* Center Text */}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                         <div className="text-center">
                             <span className="block text-2xl font-black text-slate-800">{filteredBills.length}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bills</span>
                         </div>
                     </div>
                  </div>
              </AppCard>
          </div>
      </div>

      {/* Ledger Table */}
      <div className="card-professional bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="py-4 pl-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Card</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Bill Month</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Date</th>
                        <th className="py-4 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Paid</th>
                        <th className="py-4 px-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="py-4 pr-6 w-20"></th>
                    </tr>
                </thead>
                <tbody>
                    {filteredBills.length === 0 ? (
                        <tr><td colSpan={6} className="py-12 text-center text-slate-400 font-bold text-sm">No bills found for the selected period.</td></tr>
                    ) : (
                        filteredBills.map(bill => {
                            const acc = accounts.find(a => a.id === bill.cardId);
                            return (
                                <tr key={bill.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 pl-6 font-bold text-slate-800 text-sm">{acc?.name || 'Unknown Card'}</td>
                                    <td className="py-4 px-4 font-medium text-xs text-slate-500">{bill.month}</td>
                                    <td className="py-4 px-4 font-medium text-xs text-slate-500">
                                        {bill.paymentDate ? new Date(bill.paymentDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                    </td>
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
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered Stats</p>
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
                    <CustomDatePicker 
                        value={paymentDate} 
                        onChange={setPaymentDate}
                        className="w-full"
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
