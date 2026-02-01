import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../../constants';
import { Todo } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

interface TodoOverviewProps {
    todos: Todo[];
}

const TodoOverview: React.FC<TodoOverviewProps> = ({ todos }) => {
    
    const navigate = useNavigate();

    // --- Calculations ---
    const stats = useMemo(() => {
        const totalTasks = todos.length;
        const completedTasks = todos.filter(t => t.isCompleted);
        const pendingTasks = todos.filter(t => !t.isCompleted);
        
        // Completion Rate
        const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks.length / totalTasks) * 100);

        // Today's Progress
        const today = new Date();
        today.setHours(0,0,0,0);
        const tasksToday = todos.filter(t => {
            if (t.isCompleted && t.completedAt) {
                 const d = new Date(t.completedAt);
                 d.setHours(0,0,0,0);
                 return d.getTime() === today.getTime();
            }
            // For pending, check if due date is today? Or created today? 
            // Usually "Today's Progress" implies tasks due today or worked on today.
            // Let's count tasks Completed Today vs Total Due Today + Completed Today
             if (t.dueDate) {
                 const d = new Date(t.dueDate);
                 d.setHours(0,0,0,0);
                 return d.getTime() === today.getTime();
             }
             return false;
        });
        const completedToday = tasksToday.filter(t => t.isCompleted).length;
        const totalToday = tasksToday.length;

        // On-Time Rate
        const completedWithDueDate = completedTasks.filter(t => t.dueDate && t.completedAt);
        const onTimeTasks = completedWithDueDate.filter(t => {
            const due = new Date(t.dueDate!);
            const completed = new Date(t.completedAt!);
            // Just comparing dates broadly
            due.setHours(23,59,59,999); 
            return completed <= due;
        });
        const onTimeRate = completedWithDueDate.length === 0 ? 100 : Math.round((onTimeTasks.length / completedWithDueDate.length) * 100);

        // Top Category
        const categoryCounts: Record<string, number> = {};
        todos.forEach(t => {
            categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
        });
        let topCategory = 'N/A';
        let topCategoryCount = 0;
        Object.entries(categoryCounts).forEach(([cat, count]) => {
            if (count > topCategoryCount) {
                topCategory = cat;
                topCategoryCount = count;
            }
        });
        const topCategoryPct = totalTasks === 0 ? 0 : Math.round((topCategoryCount / totalTasks) * 100);

        // Overdue Rate (of pending)
        const overdueTasks = pendingTasks.filter(t => {
            if (!t.dueDate) return false;
            const due = new Date(t.dueDate);
            due.setHours(0,0,0,0);
            return due < today;
        });
        const overdueRate = pendingTasks.length === 0 ? 0 : Math.round((overdueTasks.length / pendingTasks.length) * 100);

        // Avg Completion Time (in days)
        let totalCompletionTimeMs = 0;
        let countedForAvg = 0;
        completedWithDueDate.forEach(t => {
             const created = new Date(t.createdAt);
             const completed = new Date(t.completedAt!);
             const diff = completed.getTime() - created.getTime();
             if (diff > 0) {
                 totalCompletionTimeMs += diff;
                 countedForAvg++;
             }
        });
        const avgCompletionDays = countedForAvg === 0 ? 0 : (totalCompletionTimeMs / (countedForAvg * 1000 * 60 * 60 * 24)).toFixed(1);

        // Most Productive Day (based on completedAt)
        const dayCounts: Record<string, number> = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
        completedTasks.forEach(t => {
            if (t.completedAt) {
                const d = new Date(t.completedAt);
                const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                if (dayCounts[dayName] !== undefined) dayCounts[dayName]++;
            }
        });
        let bestDay = 'N/A';
        let bestDayCount = 0;
        Object.entries(dayCounts).forEach(([day, count]) => {
            if (count > bestDayCount) {
                bestDay = day;
                bestDayCount = count;
            }
        });

        // Current Streak (consecutive days with at least 1 completion going back from today)
        let streak = 0;
        let checkDate = new Date();
        checkDate.setHours(0,0,0,0);
        
        // Create a set of dates where at least one task was completed
        const completionDates = new Set();
        completedTasks.forEach(t => {
            if (t.completedAt) {
                const d = new Date(t.completedAt);
                d.setHours(0,0,0,0);
                completionDates.add(d.getTime());
            }
        });
        
        // Check streaks
        // If today has completion, start counting. If not, check yesterday. If yesterday has none, streak is 0 (unless we did some today).
        // Actually typically streak implies consecutive days ending today or yesterday.
        while (true) {
            if (completionDates.has(checkDate.getTime())) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                // If today is 0, allow checking yesterday to start streak (maintenance)
                const todayTime = new Date(); todayTime.setHours(0,0,0,0);
                if (checkDate.getTime() === todayTime.getTime()) {
                     checkDate.setDate(checkDate.getDate() - 1);
                     continue;
                }
                break;
            }
        }

        return {
            completionRate,
            todayProgress: `${completedToday}/${totalToday}`,
            todayPct: totalToday === 0 ? 0 : Math.round((completedToday/totalToday)*100),
            onTimeRate,
            topCategory,
            topCategoryPct,
            overdueRate,
            avgCompletionDays,
            bestDay,
            bestDayAvg: bestDayCount, // Simplified
            streak
        };
    }, [todos]);

    // Data for Graphs
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Monday
    startOfWeek.setHours(0,0,0,0);

    const chartData = useMemo(() => {
        // Last 7 days
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0,0,0,0);
            
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            const count = todos.filter(t => {
                if (!t.isCompleted || !t.completedAt) return false;
                const cDate = new Date(t.completedAt);
                cDate.setHours(0,0,0,0);
                return cDate.getTime() === d.getTime();
            }).length;
            
            data.push({ name: label, completed: count });
        }
        return data;
    }, [todos]);

    // Recent Activity
    const recentAdded = useMemo(() => {
        return [...todos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    }, [todos]);

    const recentCompleted = useMemo(() => {
        return todos.filter(t => t.isCompleted && t.completedAt)
            .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
            .slice(0, 5);
    }, [todos]);

    const getPriorityDot = (priority: string) => {
        switch (priority) {
            case 'high': return <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></div>;
            case 'medium': return <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-200"></div>;
            case 'low': return <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>;
            default: return <div className="w-2 h-2 rounded-full bg-slate-300"></div>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <ICONS.CheckCircle className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Completion Rate</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-slate-800">{stats.completionRate}%</span>
                        <span className="text-xs font-medium text-slate-400 mb-1">of all tasks</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
                            <ICONS.Star className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Current Streak</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-slate-800">{stats.streak} Days</span>
                        <span className="text-xs font-medium text-slate-400 mb-1">consistency</span>
                    </div>
                </div>

                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <ICONS.Check className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">Today's Progress</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-slate-800">{stats.todayProgress}</span>
                        <span className="text-xs font-medium text-emerald-600 mb-1 bg-emerald-50 px-1.5 py-0.5 rounded ml-auto">{stats.todayPct}% Done</span>
                    </div>
                </div>

                 <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                            <ICONS.Calendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide">On-Time Rate</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-slate-800">{stats.onTimeRate}%</span>
                        <span className="text-xs font-medium text-slate-400 mb-1">before deadline</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Graph Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Tasks Completed Over Time</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 12, fill: '#64748b'}} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 12, fill: '#64748b'}} 
                                />
                                <Tooltip 
                                    contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    itemStyle={{color: '#475569', fontSize: '12px', fontWeight: 'bold'}}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="completed" 
                                    stroke="#4f46e5" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorCompleted)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Insights Column */}
                <div className="space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Most Productive Day</p>
                            <p className="text-lg font-bold text-slate-800">{stats.bestDay}</p>
                            <p className="text-xs text-slate-500">{stats.bestDayAvg} tasks avg</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                             <ICONS.Calendar className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Top Category</p>
                            <p className="text-lg font-bold text-slate-800">{stats.topCategory}</p>
                            <p className="text-xs text-slate-500">{stats.topCategoryPct}% of tasks</p>
                        </div>
                         <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                             <ICONS.Dashboard className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Completion Time</p>
                            <p className="text-lg font-bold text-slate-800">{stats.avgCompletionDays} Days</p>
                            <p className="text-xs text-slate-500">from creation to done</p>
                        </div>
                         <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                             <ICONS.Plus className="w-5 h-5 rotate-45" /> 
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Overdue Rate</p>
                            <p className="text-lg font-bold text-slate-800">{stats.overdueRate}%</p>
                             <p className="text-xs text-rose-500 font-medium">of pending tasks</p>
                        </div>
                         <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                             <ICONS.Delete className="w-5 h-5 text-rose-500" /> 
                        </div>
                    </div>
                </div>
            </div>


            {/* Recent Activity Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Added */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800">Recent Tasks Added</h3>
                        <button onClick={() => navigate('/todo/list')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                            View All <ICONS.ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white">Task</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white">Priority</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white text-right">Added</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAdded.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-sm text-slate-400">No tasks added yet</td>
                                    </tr>
                                ) : (
                                    recentAdded.map(task => (
                                        <tr key={task.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-default">
                                            <td className="py-3 px-5">
                                                <p className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{task.title}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{task.category}</p>
                                            </td>
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-2">
                                                    {getPriorityDot(task.priority)}
                                                    <span className="text-xs text-slate-600 capitalize">{task.priority}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-5 text-right">
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Completed */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-800">Recently Completed</h3>
                        <button onClick={() => navigate('/todo/list')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                            View All <ICONS.ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white">Task</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white">Priority</th>
                                    <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white text-right">Completed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentCompleted.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-sm text-slate-400">No completed tasks yet</td>
                                    </tr>
                                ) : (
                                    recentCompleted.map(task => (
                                        <tr key={task.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors cursor-default">
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-0.5 bg-emerald-100 rounded-full">
                                                        <ICONS.Check className="w-3 h-3 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-700 truncate max-w-[150px] line-through opacity-70">{task.title}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-5">
                                                <div className="flex items-center gap-2 opacity-70">
                                                    {getPriorityDot(task.priority)}
                                                    <span className="text-xs text-slate-600 capitalize">{task.priority}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-5 text-right">
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {new Date(task.completedAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TodoOverview;
