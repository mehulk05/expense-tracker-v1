
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ICONS } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../services/storage';
import { Todo } from '../../types';
import SidePopover from '../../components/SidePopover';
import TodoOverview from './TodoOverview';

const TodoApp: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const { addToast } = useToast();

    // Filters & Sort
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = useState('');
    const [category, setCategory] = useState('Personal');
    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        loadTodos();
    }, []);

    const loadTodos = async () => {
        try {
            const data = await storage.getTodos();
            setTodos(data);
        } catch (e) {
            console.error(e);
            addToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        const newTodo: Todo = {
            id: editId || crypto.randomUUID(),
            title,
            description,
            priority,
            dueDate,
            category,
            isCompleted: editId ? todos.find(t => t.id === editId)?.isCompleted || false : false,
            isPinned: editId ? todos.find(t => t.id === editId)?.isPinned || false : false,
            createdAt: editId ? todos.find(t => t.id === editId)?.createdAt || new Date().toISOString() : new Date().toISOString()
        };

        try {
            await storage.saveTodo(newTodo);
            setTodos(prev => editId ? prev.map(t => t.id === editId ? newTodo : t) : [newTodo, ...prev]);
            addToast(`Task ${editId ? 'updated' : 'added'} successfully`, 'success');
            resetForm();
        } catch (error) {
            addToast('Failed to save task', 'error');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this task?')) return;
        try {
            await storage.deleteTodo(id);
            setTodos(prev => prev.filter(t => t.id !== id));
            addToast('Task deleted', 'success');
        } catch (error) {
            addToast('Failed to delete task', 'error');
        }
    };

    const toggleComplete = async (todo: Todo) => {
        const updated = {
            ...todo,
            isCompleted: !todo.isCompleted,
            completedAt: !todo.isCompleted ? new Date().toISOString() : undefined
        };
        try {
            await storage.saveTodo(updated);
            setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
        } catch (error) {
            addToast('Update failed', 'error');
        }
    };

    const togglePin = async (todo: Todo, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = { ...todo, isPinned: !todo.isPinned };
        try {
            await storage.saveTodo(updated);
            setTodos(prev => prev.map(t => t.id === todo.id ? updated : t));
        } catch (error) {
            addToast('Update failed', 'error');
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setCategory('Personal');
        setEditId(null);
        setShowAdd(false);
    };


    // --- Helpers defined early ---
    const getPriorityDot = (p: string) => {
        switch (p) {
            case 'high': return <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm ring-1 ring-rose-100" title="High Priority"></span>;
            case 'medium': return <span className="w-2 h-2 rounded-full bg-orange-400 shadow-sm ring-1 ring-orange-100" title="Medium Priority"></span>;
            case 'low': return <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm ring-1 ring-emerald-100" title="Low Priority"></span>;
            default: return <span className="w-2 h-2 rounded-full bg-slate-300"></span>;
        }
    };

    const isOverdue = (date?: string) => {
        if (!date) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    };

    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const location = useLocation();
    const activeTab = location.pathname.includes('/list') ? 'todos' : 'overview';

    // --- Stats Logic ---
    const getStats = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const totalTasksMonth = todos.filter(t => {
            const d = new Date(t.createdAt);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const completedMonth = todos.filter(t => {
            const d = new Date(t.createdAt);
            return t.isCompleted && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;

        const pendingTotal = todos.filter(t => !t.isCompleted).length;
        
        const overdueTotal = todos.filter(t => !t.isCompleted && t.dueDate && isOverdue(t.dueDate)).length;

        const progress = totalTasksMonth === 0 ? 0 : Math.round((completedMonth / totalTasksMonth) * 100);

        return { totalTasksMonth, completedMonth, pendingTotal, overdueTotal, progress };
    };

    const stats = getStats();

    // --- Derived State ---
    const filteredTodos = todos
        .filter(t => {
            if (filterStatus === 'pending') return !t.isCompleted;
            if (filterStatus === 'completed') return t.isCompleted;
            return true;
        })
        .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
            if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            return 0;
        });

    const groupTodos = () => {
        const groups = {
            overdue: [] as Todo[],
            upcoming: [] as Todo[],
            completed: [] as Todo[]
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filteredTodos.forEach(todo => {
            if (todo.isCompleted) {
                groups.completed.push(todo);
                return;
            }

            if (!todo.dueDate) {
                groups.upcoming.push(todo);
                return;
            }

            const due = new Date(todo.dueDate);
            due.setHours(0, 0, 0, 0);

            if (due < today) {
                groups.overdue.push(todo);
            } else {
                groups.upcoming.push(todo);
            }
        });
        return groups;
    };

    const taskGroups = groupTodos();

    // --- Render Components ---
    const RenderTaskGroup = ({ title, tasks, icon: Icon, colorClass, bgClass }: { title: string, tasks: Todo[], icon?: any, colorClass?: string, bgClass?: string }) => {
        return (
            <div className={`h-full flex flex-col rounded-2xl border border-slate-200/60 bg-white overflow-hidden ${tasks.length === 0 ? 'opacity-80' : ''}`}>
                {/* Column Header */}
                <div className={`p-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm ${bgClass}`}>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${colorClass?.replace('text-', 'bg-') || 'bg-slate-400'}`}></div>
                        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                        <span className="bg-white border border-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{tasks.length}</span>
                    </div>
                    <button onClick={() => { resetForm(); setShowAdd(true); }} className="text-slate-400 hover:text-indigo-600 transition-colors bg-white p-1 rounded-md shadow-sm border border-slate-100 hover:border-indigo-100">
                        <ICONS.Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Scrollable Task List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {tasks.length === 0 ? (
                        <div className="h-32 flex flex-col items-center justify-center text-center opacity-60">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                <Icon className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-xs text-slate-400 font-medium">No tasks</p>
                        </div>
                    ) : (
                        tasks.map(todo => (
                             <div 
                                key={todo.id}
                                onClick={() => openEdit(todo)}
                                className="group relative bg-white p-4 rounded-xl border border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] active:translate-y-0"
                            >
                                <div className="flex items-start gap-3">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleComplete(todo); }}
                                        className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                                            todo.isCompleted 
                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                            : 'border-slate-300 hover:border-emerald-500 text-transparent'
                                        }`}
                                    >
                                        <ICONS.Check className="w-2.5 h-2.5" strokeWidth={3} />
                                    </button>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`text-sm font-bold text-slate-800 leading-snug break-words ${todo.isCompleted ? 'line-through text-slate-400 font-medium' : ''}`}>
                                                {todo.title}
                                            </h3>
                                            {todo.isPinned && <ICONS.Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0 mt-0.5" />}
                                        </div>
                                        
                                        <div className="flex items-center flex-wrap gap-2 mt-2.5">
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                {getPriorityDot(todo.priority)}
                                                <span className="text-[10px] font-bold text-slate-500 tracking-wide capitalize">{todo.priority}</span>
                                            </div>
                                            {todo.isCompleted && todo.completedAt ? (
                                                <span className="text-[10px] font-medium px-2 py-1 rounded-md border bg-emerald-50 text-emerald-600 border-emerald-100 flex items-center gap-1">
                                                    <ICONS.Check className="w-3 h-3" />
                                                    {new Date(todo.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            ) : todo.dueDate && (
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${
                                                    isOverdue(todo.dueDate) 
                                                    ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                }`}>
                                                    {new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Edit Logic on Hover */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(todo.id, e); }}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md"
                                    >
                                        <ICONS.Delete className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const RenderTableView = () => {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-12"></th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Task</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Status</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Priority</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Due Date</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredTodos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                                    No tasks found based on current filters.
                                </td>
                            </tr>
                        ) : (
                            filteredTodos.map(todo => (
                                <tr key={todo.id} onClick={() => openEdit(todo)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                                    <td className="py-4 px-6 text-center">
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); toggleComplete(todo); }}
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200 ${
                                                todo.isCompleted 
                                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                : 'border-slate-300 hover:border-emerald-500 text-transparent'
                                            }`}
                                        >
                                            <ICONS.Check className="w-3 h-3" strokeWidth={3} />
                                        </button>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium text-slate-900 ${todo.isCompleted ? 'line-through text-slate-400' : ''}`}>{todo.title}</span>
                                            {todo.isPinned && <ICONS.Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                                        </div>
                                        {todo.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{todo.description}</p>}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            todo.isCompleted 
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                            : todo.dueDate && isOverdue(todo.dueDate)
                                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                            : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                        }`}>
                                            {todo.isCompleted ? 'Completed' : (todo.dueDate && isOverdue(todo.dueDate) ? 'Overdue' : 'Pending')}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            {getPriorityDot(todo.priority)}
                                            <span className="text-xs font-medium text-slate-600 capitalize">{todo.priority}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="text-xs text-slate-600 font-medium">
                                            {todo.isCompleted && todo.completedAt ? (
                                                <span className="text-emerald-600">Done {new Date(todo.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            ) : todo.dueDate ? (
                                                new Date(todo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(todo.id, e); }}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ICONS.Delete className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    const openEdit = (todo: Todo) => {
        setTitle(todo.title);
        setDescription(todo.description || '');
        setPriority(todo.priority);
        setDueDate(todo.dueDate || '');
        setCategory(todo.category);
        setEditId(todo.id);
        setShowAdd(true);
    };

    const StatCard = ({ label, value, colorClass, bgClass, icon: Icon }: { label: string, value: number, colorClass: string, bgClass: string, icon: any }) => (
        <div className={`p-4 rounded-xl border border-slate-100/50 ${bgClass} flex items-center justify-between`}>
            <div>
                 <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
                 <h3 className={`text-xl font-bold tracking-tight ${colorClass}`}>{value}</h3>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/80`}>
                 <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
        </div>
    );

    if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div></div>;

    return (
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col pt-6 px-6 md:px-8 pb-4 ${activeTab === 'todos' ? 'h-[calc(100vh-64px)]' : ''}`}>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 flex-shrink-0">
                <div className="space-y-4 md:space-y-0 text-slate-900 font-bold tracking-tight">
                    <h1 className="text-2xl font-bold">{activeTab === 'overview' ? 'Overview' : 'My Tasks'}</h1>
                    {activeTab === 'overview' && <p className="text-slate-500 text-sm">Track your productivity metrics</p>}
                    {activeTab === 'todos' && <p className="text-slate-500 text-sm">Manage your daily tasks</p>}
                </div>

                {activeTab === 'todos' && (
                    <div className="flex items-center gap-3">
                        <div className="relative w-64 hidden md:block">
                            <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search tasks..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-700 outline-none transition-all shadow-sm"
                            />
                        </div>
                        
                        {/* View Toggle */}
                        <div className="bg-slate-100 p-1 rounded-lg flex items-center border border-slate-200">
                            <button 
                                onClick={() => setViewMode('board')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Board View"
                            >
                                <ICONS.Dashboard className="w-4 h-4" /> 
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="List View"
                            >
                                <div className="flex flex-col gap-0.5 w-4 h-4 justify-center items-center">
                                    <div className="w-3.5 h-0.5 bg-current rounded-full"></div>
                                    <div className="w-3.5 h-0.5 bg-current rounded-full"></div>
                                    <div className="w-3.5 h-0.5 bg-current rounded-full"></div>
                                </div>
                            </button>
                        </div>

                        <button onClick={() => { resetForm(); setShowAdd(true); }} className="btn-primary !rounded-lg !py-2 !px-4 hover:shadow-md transition-all flex items-center gap-2">
                            <ICONS.Plus className="w-4 h-4" />
                            <span className="text-sm font-bold">New Task</span>
                        </button>
                    </div>
                )}
            </div>

            {/* View Content */}
            {activeTab === 'overview' ? (
                <div>
                    <TodoOverview todos={todos} />
                </div>
            ) : viewMode === 'board' ? (
                /* Kanban Board Layout - Full Height */
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden pb-2 -mx-6 px-6 md:mx-0 md:px-0">
                     <div className="h-full grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[320px] md:min-w-0">
                         <RenderTaskGroup title="Overdue" tasks={taskGroups.overdue} icon={ICONS.Calendar} colorClass="text-rose-600" bgClass="" />
                         <RenderTaskGroup title="Upcoming" tasks={taskGroups.upcoming} icon={ICONS.Check} colorClass="text-indigo-600" bgClass="" />
                         <RenderTaskGroup title="Completed" tasks={taskGroups.completed} icon={ICONS.CheckCircle} colorClass="text-emerald-600" bgClass="" />
                     </div>
                </div>
            ) : (
                /* Table View - Full Height */
                <div className="flex-1 overflow-auto pb-4 custom-scrollbar">
                    <RenderTableView />
                </div>
            )}
            
            {/* Modal */}
            <SidePopover
                isOpen={showAdd}
                onClose={() => setShowAdd(false)}
                title={editId ? "Edit Task" : "New Task"}
            >
                <form onSubmit={handleSave} className="space-y-6">
                    <div>
                        <label className="label-professional">Category</label>
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="input-professional !rounded-lg"
                        >
                            <option>Personal</option>
                            <option>Work</option>
                            <option>Study</option>
                            <option>Shopping</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="label-professional">Title</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="input-professional !rounded-lg"
                            placeholder="What needs to be done?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-professional">Priority</label>
                            <select 
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="input-professional !rounded-lg"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                             <label className="label-professional">Due date</label>
                             <input 
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="input-professional !rounded-lg"
                             />
                        </div>
                    </div>

                    <div>
                        <label className="label-professional">Description</label>
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={4}
                            className="input-professional !rounded-lg resize-none"
                            placeholder="Add details..."
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-3">
                         <button type="button" onClick={() => setShowAdd(false)} className="flex-1 btn-secondary !rounded-lg !py-2.5 text-sm font-medium">Cancel</button>
                         <button type="submit" disabled={!title} className="flex-1 btn-primary !rounded-lg !py-2.5 text-sm font-medium shadow-sm">
                            {editId ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </SidePopover>
        </div>
    );
};

export default TodoApp;
