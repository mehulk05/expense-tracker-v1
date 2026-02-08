import React from 'react';
import { ICONS } from '../../constants';
import { formatCurrency } from '../../utils/currency';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, trend, trendUp, icon: Icon, color, iconBg, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md cursor-pointer group`}
  >
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-sm font-medium text-slate-500">{label}</h3>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${color} transition-transform group-hover:scale-110`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    
    <div className="space-y-1">
      <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{value}</h2>
      {subtext && <p className="text-xs text-slate-400 font-medium">{subtext}</p>}
    </div>

    {trend && (
      <div className="mt-4 flex items-center gap-2">
        <span className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-600'} bg-opacity-10 px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {trendUp ? <ICONS.TrendingUp className="w-3 h-3" /> : <ICONS.TrendingDown className="w-3 h-3" />}
          {trend}
        </span>
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">vs last month</span>
      </div>
    )}
  </div>
);

interface SummaryStatsProps {
  totalSpent: number;
  dateRange: string;
  previousSpent?: number;
  pendingTasks: number;
  splitwiseNet: number;
  highestExpenseAmount: number;
  topPaymentMethod: string;
  topCategory: { name: string; value: number };
  topCard: { name: string; value: number };
  transactionCount: number;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ 
  totalSpent, 
  dateRange, 
  pendingTasks, 
  splitwiseNet,
  highestExpenseAmount,
  topPaymentMethod,
  topCategory,
  topCard,
  transactionCount
}) => {
  const navigate = useNavigate();

  const stats = [
    // Row 1
    {
      label: 'Total Expenses',
      value: formatCurrency(totalSpent),
      subtext: `During this ${dateRange}`,
      trend: '12%', 
      trendUp: false, 
      icon: ICONS.Expense,
      color: 'text-blue-600',
      iconBg: 'bg-blue-50',
      onClick: () => navigate('/expenses')
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks.toString(),
      subtext: `${pendingTasks > 0 ? 'Needs attention' : 'All caught up'}`,
      trend: undefined,
      icon: ICONS.CheckCircle,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      onClick: () => navigate('/todo')
    },
    {
      label: 'Splitwise Net',
      value: formatCurrency(Math.abs(splitwiseNet)),
      subtext: splitwiseNet >= 0 ? 'You are owed' : 'You owe',
      trend: undefined,
      icon: ICONS.Users,
      color: splitwiseNet >= 0 ? 'text-emerald-600' : 'text-orange-600',
      iconBg: splitwiseNet >= 0 ? 'bg-emerald-50' : 'bg-orange-50',
      onClick: () => navigate('/splitwise')
    },
    {
      label: 'Highest Expense',
      value: formatCurrency(highestExpenseAmount),
      subtext: 'Single largest transaction',
      trend: undefined,
      icon: ICONS.Award,
      color: 'text-purple-600',
      iconBg: 'bg-purple-50',
      onClick: () => navigate('/expenses')
    },

    // Row 2
    {
        label: 'Top Category',
        value: topCategory.name,
        subtext: `${formatCurrency(topCategory.value)} spent`,
        trend: undefined,
        icon: ICONS.Graph,
        color: 'text-pink-600',
        iconBg: 'bg-pink-50',
        onClick: () => navigate('/expenses')
    },
    {
        label: 'Top Card',
        value: topCard.name,
        subtext: `${formatCurrency(topCard.value)} used`,
        trend: undefined,
        icon: ICONS.Cards,
        color: 'text-cyan-600',
        iconBg: 'bg-cyan-50',
        onClick: () => navigate('/expenses')
    },
    {
        label: 'Transactions',
        value: transactionCount.toString(),
        subtext: `Total count`,
        trend: undefined,
        icon: ICONS.History,
        color: 'text-indigo-600',
        iconBg: 'bg-indigo-50',
        onClick: () => navigate('/expenses')
    },
    {
        label: 'Daily Average',
        value: formatCurrency(dateRange === 'week' ? totalSpent/7 : totalSpent/30),
        subtext: 'Approximate', 
        trend: undefined,
        icon: ICONS.TrendingUp,
        color: 'text-amber-600',
        iconBg: 'bg-amber-50',
        onClick: () => navigate('/expenses')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, idx) => (
         <StatCard key={idx} {...stat} onClick={stat.onClick} />
      ))}
    </div>
  );
};

export default SummaryStats;
