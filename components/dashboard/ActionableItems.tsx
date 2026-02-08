import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../../constants';
import { formatCurrency } from '../../utils/currency';
import { AppCard } from '../../components/ui/AppCard';
import { Expense, Todo, CreditCardBill } from '../../types';

interface ActionableItemsProps {
  recentExpenses: Expense[];
  upcomingBills: CreditCardBill[];
  pendingTodos: Todo[];
  showTasks?: boolean;
}

const ActionableItems: React.FC<ActionableItemsProps> = ({ recentExpenses, upcomingBills, pendingTodos, showTasks = true }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Recent Activity */}
      <AppCard className="p-6 col-span-1 lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Activity</h3>
            <button onClick={() => navigate('/expenses')} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">View All</button>
        </div>
        
        {recentExpenses.length > 0 ? (
            <div className="space-y-4">
            {recentExpenses.slice(0, 5).map(exp => (
                <div key={exp.id} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                            <ICONS.Expense className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{exp.description || 'Unspecified Expense'}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(exp.date).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatCurrency(exp.amount)}</p>
                </div>
            ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-500 mb-1">No recent activity</p>
                <button onClick={() => navigate('/expenses')} className="text-xs text-blue-600 font-bold hover:underline">Add expense</button>
            </div>
        )}
      </AppCard>

      {/* Action List (Bills & Tasks) */}
      <div className="space-y-6">
        
        {/* Pending Tasks */}
        {showTasks && (
        <AppCard className="p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pending Tasks</h3>
                <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingTodos.length}</span>
            </div>
            {pendingTodos.length > 0 ? (
                <div className="space-y-3">
                    {pendingTodos.slice(0, 3).map(todo => (
                        <div key={todo.id} className="flex items-start gap-3 p-2 hover:bg-orange-50/50 rounded-lg transition-colors cursor-pointer" onClick={() => navigate('/todo')}>
                            <div className="mt-0.5"><div className="w-4 h-4 rounded-full border-2 border-orange-200" /></div>
                            <p className="text-xs font-bold text-slate-700 line-clamp-2">{todo.text}</p>
                        </div>
                    ))}
                    {pendingTodos.length > 3 && (
                        <button onClick={() => navigate('/todo')} className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-orange-600 mt-2">
                            +{pendingTodos.length - 3} more tasks
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-400 mb-2">
                        <ICONS.Check className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-500">All caught up!</p>
                    <button onClick={() => navigate('/todo')} className="text-[10px] text-orange-600 font-bold hover:underline mt-1">Add new task</button>
                </div>
            )}
        </AppCard>
        )}

        {/* Upcoming Bills */}
        <AppCard className="p-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Upcoming Bills</h3>
            {upcomingBills.length > 0 ? (
                <div className="space-y-3">
                    {upcomingBills.slice(0, 2).map(bill => (
                        <div key={bill.id} className="flex justify-between items-center p-2 hover:bg-red-50/50 rounded-lg transition-colors">
                            <div>
                                <p className="text-xs font-bold text-slate-700">{bill.cardName}</p>
                                <p className="text-[10px] text-red-500 font-bold uppercase">Due {new Date(bill.dueDate).toLocaleDateString()}</p>
                            </div>
                            <p className="text-xs font-bold text-slate-900">{formatCurrency(bill.amount)}</p>
                        </div>
                    ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-xs font-bold text-slate-400">No upcoming bills</p>
                    <button onClick={() => navigate('/credit-cards')} className="text-[10px] text-blue-600 font-bold hover:underline mt-1">Manage cards</button>
                </div>
            )}
        </AppCard>
      </div>
    </div>
  );
};

export default ActionableItems;
