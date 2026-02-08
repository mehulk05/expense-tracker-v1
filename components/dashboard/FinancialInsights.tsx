import React from 'react';
import { formatCurrency } from '../../utils/currency';
import { AppCard } from '../../components/ui/AppCard';
import { ICONS } from '../../constants';
import { Category, Expense, CreditCardBill } from '../../types';

interface FinancialInsightsProps {
  expenses: Expense[];
  categories: Category[];
  totalSpent: number;
  upcomingBills: CreditCardBill[];
}

const FinancialInsights: React.FC<FinancialInsightsProps> = ({ expenses, categories, totalSpent, upcomingBills }) => {
  const generateInsights = () => {
    const insights = [];

    // 1. Top Category Insight
    if (categories.length > 0) {
      const topCat = categories[0]; // Assumes sorted
      const percent = Math.round((topCat.value / totalSpent) * 100);
      if (percent > 30) {
        insights.push({
          type: 'alert',
          icon: ICONS.Alert,
          title: 'High Category Spend',
          text: `${topCat.name} makes up ${percent}% of your total spending.`
        });
      }
    }

    // 2. High Frequency Insight
    const txCount = expenses.length;
    if (txCount > 20) {
        insights.push({
            type: 'info',
            icon: ICONS.Graph, // Use Chart/Graph icon
            title: 'High Activity',
            text: `You've made ${txCount} transactions in this period.`
        });
    }

    // 3. Bill Insight
    if (upcomingBills.length > 0) {
        const nextBill = upcomingBills[0]; // Assumes sorted
        const daysDue = Math.ceil((new Date(nextBill.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysDue <= 3 && daysDue >= 0) {
            insights.push({
                type: 'warning',
                icon: ICONS.Calendar,
                title: 'Bill Due Soon',
                text: `${nextBill.cardName} bill for ${formatCurrency(nextBill.amount)} is due in ${daysDue === 0 ? 'today' : `${daysDue} days`}.`
            });
        }
    }

    // 4. Large Transaction Insight
    const largeTx = expenses.find(e => e.amount > 5000);
    if (largeTx) {
        insights.push({
            type: 'highlight',
            icon: ICONS.Wallet,
            title: 'Large One-Time Expense',
            text: `You spent ${formatCurrency(largeTx.amount)} on ${largeTx.description || 'an item'} on ${new Date(largeTx.date).toLocaleDateString()}.`
        });
    }

    // Fallback if no insights
    if (insights.length === 0) {
        insights.push({
            type: 'success',
            icon: ICONS.Check,
            title: 'Smooth Sailing',
            text: "Your spending looks balanced. Keep it up!"
        });
    }

    return insights.slice(0, 3); // Top 3 insights
  };

  const insights = generateInsights();

  return (
    <AppCard className="p-6 h-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
            <ICONS.Sparkles className="w-4 h-4" />
        </div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Financial Insights</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, idx) => (
            <div key={idx} className="flex gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all duration-300">
                <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                    ${insight.type === 'alert' ? 'bg-red-100 text-red-600' : 
                      insight.type === 'warning' ? 'bg-orange-100 text-orange-600' : 
                      insight.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                      'bg-blue-100 text-blue-600'}`}
                >
                    <insight.icon className="w-4 h-4" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900">{insight.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">{insight.text}</p>
                </div>
            </div>
        ))}
      </div>
    </AppCard>
  );
};

export default FinancialInsights;
