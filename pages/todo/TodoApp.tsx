
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ICONS } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../services/storage';
import { Todo } from '../../types';
import SidePopover from '../../components/SidePopover';
import TodoOverview from './TodoOverview';
import { CustomDateRangePicker } from '../../components/ui/CustomDateRangePicker';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { AppCard } from '../../components/ui/AppCard';



const TodoApp: React.FC = () => {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const { addToast } = useToast();

    // Filters & Sort
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    
    // Time Filtering
    const [timeFilter, setTimeFilter] = useState<'all' | 'this-week' | 'this-month' | 'last-month' | 'custom'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [dueDate, setDueDate] = useState(() => {
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        return oneWeekFromNow.toISOString().split('T')[0];
    });
    const [category, setCategory] = useState('Personal');
    const [editId, setEditId] = useState<string | null>(null);

    // New State for Tabs and Sorting
    const [todoTab, setTodoTab] = useState<'active' | 'completed'>('active');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'dueDate', direction: 'asc' });
    const [groupBy, setGroupBy] = useState<'none' | 'category' | 'priority' | 'dueDate'>('none');

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
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        setDueDate(oneWeekFromNow.toISOString().split('T')[0]);
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

    const [viewMode, setViewMode] = useState<'board' | 'list'>('list');
    const location = useLocation();
    const activeTab = location.pathname.includes('/list') ? 'todos' : 'overview';

    // --- Filtering Logic ---
    const timeFilteredTodos = React.useMemo(() => {
        return todos.filter(t => {
            const expDate = new Date(t.createdAt);
            const now = new Date();

            if (timeFilter === 'this-month') {
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            } else if (timeFilter === 'last-month') {
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return expDate.getMonth() === lastMonth.getMonth() && expDate.getFullYear() === lastMonth.getFullYear();
            } else if (timeFilter === 'this-week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                // For "This Week" in terms of upcoming tasks, we usually want due dates. 
                // But this filter seems to be based on createdAt (historical).
                // If it's for planning "My Week", users might expect *Tasks Due This Week*.
                // Let's assume based on context of 'expense tracker' historical data vs todo list future data.
                // For Todo, filtering by creation date might not be as useful as due date for "This Week".
                // HOWEVER, to keep consistent with existing logic which uses `createdAt` (line 167), I will stick to createdAt for now unless I change the whole logic.
                // Wait, line 167 says `const expDate = new Date(t.createdAt);`.
                // Let's change the logic to use Due Date for 'this-week' if available, otherwise createdAt?
                // Actually, for a Todo List, "This Week" usually implies "Due This Week".
                // But `timeFilteredTodos` was originally written for creation date filtering (likely copy-pasted or standard pattern).
                // Let's stick to createdAt for consistency with other filters, OR allows due date if it exists?
                // The user asked "provide the task for this week so that user can quickly access them".
                // This implies "Tasks I need to do this week".
                
                if (t.dueDate) {
                   const uDue = new Date(t.dueDate);
                   const uNow = new Date();
                   uNow.setHours(0,0,0,0);
                   const uNextWeek = new Date(uNow);
                   uNextWeek.setDate(uNextWeek.getDate() + 7);
                   return uDue >= uNow && uDue <= uNextWeek;
                }
                return false; // If no due date, don't show in "This Week" view
            } else if (timeFilter === 'custom') {
                if (startDate && t.createdAt < startDate) return false;
                if (endDate && t.createdAt > endDate) return false;
            }
            return true;
        });
    }, [todos, timeFilter, startDate, endDate]);

    const priorityMetrics = React.useMemo(() => {
        return {
            high: timeFilteredTodos.filter(t => t.priority === 'high').length,
            medium: timeFilteredTodos.filter(t => t.priority === 'medium').length,
            low: timeFilteredTodos.filter(t => t.priority === 'low').length,
            total: timeFilteredTodos.length,
            completed: timeFilteredTodos.filter(t => t.isCompleted).length
        };
    }, [timeFilteredTodos]);

    const filteredTodos = React.useMemo(() => {
        return timeFilteredTodos
            .filter(t => {
                // Tab Filter
                // Only apply tab filter in LIST view
                if (viewMode === 'list') {
                    if (todoTab === 'active') return !t.isCompleted;
                    if (todoTab === 'completed') return t.isCompleted;
                }
                return true;
            })
            .filter(t => {
                if (priorityFilter !== 'all') return t.priority === priorityFilter;
                return true;
            })
            .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
                
                // Sort by due date
                const dateA = a.dueDate ? new Date(a.dueDate).getTime() : (sortConfig.direction === 'asc' ? Number.MAX_SAFE_INTEGER : 0);
                const dateB = b.dueDate ? new Date(b.dueDate).getTime() : (sortConfig.direction === 'asc' ? Number.MAX_SAFE_INTEGER : 0);
                
                if (sortConfig.direction === 'asc') {
                    return dateA - dateB;
                } else {
                    return dateB - dateA;
                }
            });
    }, [timeFilteredTodos, todoTab, priorityFilter, searchQuery, sortConfig, viewMode]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const stats = React.useMemo(() => {
        const total = timeFilteredTodos.length;
        const completed = timeFilteredTodos.filter(t => t.isCompleted).length;
        const pendingTotal = timeFilteredTodos.filter(t => !t.isCompleted).length;
        const overdueTotal = timeFilteredTodos.filter(t => !t.isCompleted && t.dueDate && isOverdue(t.dueDate)).length;
        const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

        return { totalTasksMonth: total, completedMonth: completed, pendingTotal, overdueTotal, progress };
    }, [timeFilteredTodos]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredTodos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTodos = filteredTodos.slice(startIndex, endIndex);

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    // --- Grouping Logic ---
    const getTodoGroup = (todo: Todo, method: 'category' | 'priority' | 'dueDate'): string => {
        if (method === 'category') return todo.category || 'Uncategorized';
        if (method === 'priority') return todo.priority;
        if (method === 'dueDate') {
            if (!todo.dueDate) return 'No Date';
            const due = new Date(todo.dueDate);
            due.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) return 'Overdue';
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Tomorrow';
            if (diffDays > 1 && diffDays <= 7) return 'This Week';
            if (diffDays > 7 && diffDays <= 14) return 'Next Week';
            return 'Later';
        }
        return 'All';
    };

    const groupedTodos = React.useMemo(() => {
        if (groupBy === 'none') return null;

        const groups: Record<string, Todo[]> = {};
        
        filteredTodos.forEach(todo => {
            const key = getTodoGroup(todo, groupBy);
            if (!groups[key]) groups[key] = [];
            groups[key].push(todo);
        });

        // Sort keys based on grouping method
        let sortedKeys: string[] = [];
        if (groupBy === 'priority') {
            const order = ['high', 'medium', 'low'];
            sortedKeys = Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b));
        } else if (groupBy === 'dueDate') {
            const order = ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Next Week', 'Later', 'No Date'];
            sortedKeys = Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b));
        } else {
            sortedKeys = Object.keys(groups).sort();
        }

        return sortedKeys.map(key => ({
            title: key,
            todos: groups[key]
        }));
    }, [filteredTodos, groupBy]);


    // Kanban Board Grouping (Fixed)
    const boardGroups = React.useMemo(() => {
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
    }, [filteredTodos]);

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

    const RenderTableView = ({ todos }: { todos: Todo[] }) => {
        return (
            <div className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-12"></th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Task</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Category</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Status</th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Priority</th>
                            <th 
                                className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-32 cursor-pointer hover:text-indigo-600 transition-colors group"
                                onClick={() => handleSort('dueDate')}
                            >
                                <div className="flex items-center gap-1">
                                    Due Date
                                    <div className="flex flex-col">
                                        <ICONS.ChevronUp className={`w-2 h-2 ${sortConfig.key === 'dueDate' && sortConfig.direction === 'asc' ? 'text-indigo-600' : 'text-slate-300'}`} />
                                        <ICONS.ChevronDown className={`w-2 h-2 -mt-0.5 ${sortConfig.key === 'dueDate' && sortConfig.direction === 'desc' ? 'text-indigo-600' : 'text-slate-300'}`} />
                                    </div>
                                </div>
                            </th>
                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider w-20 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {todos.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                                    No tasks found based on current filters.
                                </td>
                            </tr>
                        ) : (
                            todos.map(todo => (
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
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {todo.category || 'Personal'}
                                        </span>
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

                {/* Pagination Controls */}
                {filteredTodos.length > 0 && (
                    <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                        {/* Left: Page Info */}
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-slate-600 font-medium">
                                Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
                                <span className="font-bold text-slate-900">{Math.min(endIndex, filteredTodos.length)}</span> of{' '}
                                <span className="font-bold text-slate-900">{filteredTodos.length}</span> tasks
                            </p>
                            
                            {/* Items per page selector */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-600 font-medium">Show:</label>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                                    className="text-sm font-medium border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>

                        {/* Right: Page Navigation */}
                        <div className="flex items-center gap-2">
                            {/* First Page */}
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                aria-label="First page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>

                            {/* Previous Page */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                aria-label="Previous page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Show pages around current page
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-3.5 py-2 text-sm font-bold rounded-lg transition-all ${
                                                currentPage === pageNum
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Next Page */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                aria-label="Next page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Last Page */}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                aria-label="Last page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
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
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col p-4 ${activeTab === 'todos' ? 'h-full overflow-y-auto' : ''}`}>
            
            {/* GLOBAL FILTERS & METRICS */}
            <div className="space-y-4 mb-6 flex-shrink-0">
                {/* 1. Refined Global Filter Bar - Right Aligned */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {/* Left: Section Title */}
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Task Statistics</h2>
                        <p className="text-sm text-slate-500 font-medium">Manage and filter your daily productivity</p>
                    </div>

                    {/* Right: Filters aligned to the right */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 ml-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Time Filter Button Group */}
                            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm h-fit">
                                {[
                                    { id: 'all', label: 'All Time' },
                                    { id: 'this-week', label: 'This Week' },
                                    { id: 'this-month', label: 'This Month' },
                                    { id: 'last-month', label: 'Last Month' },
                                    { id: 'custom', label: 'Custom' }
                                ].map((opt) => (
                                    <div key={opt.id} className="flex items-center">
                                        <button
                                            onClick={() => setTimeFilter(opt.id as any)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                                                timeFilter === opt.id 
                                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                        
                                        {/* Inline Date Picker next to Custom */}
                                        {opt.id === 'custom' && timeFilter === 'custom' && (
                                            <div className="ml-2 animate-in slide-in-from-left-2 duration-300">
                                                <CustomDateRangePicker 
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    onRangeChange={(start, end) => {
                                                        setStartDate(start);
                                                        setEndDate(end);
                                                    }}
                                                    className="w-56"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Priority Filter Button Group - Indigo themed */}
                            <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm h-fit">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'high', label: 'High' },
                                    { id: 'medium', label: 'Med' },
                                    { id: 'low', label: 'Low' }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setPriorityFilter(opt.id as any)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-2 ${
                                            priorityFilter === opt.id 
                                                ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100' 
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {opt.id !== 'all' && (
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                opt.id === 'high' ? 'bg-rose-500' : opt.id === 'medium' ? 'bg-orange-400' : 'bg-emerald-500'
                                            }`} />
                                        )}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Minimal Metric Cards - White Backgrounds */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <AppCard className="p-5 border-slate-100 bg-white">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">High Priority</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{priorityMetrics.high} <span className="text-xs text-slate-400 font-medium">tasks</span></p>
                    </AppCard>
                    <AppCard className="p-5 border-slate-100 bg-white">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Medium Priority</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{priorityMetrics.medium} <span className="text-xs text-slate-400 font-medium">tasks</span></p>
                    </AppCard>
                    <AppCard className="p-5 border-slate-100 bg-white">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Low Priority</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{priorityMetrics.low} <span className="text-xs text-slate-400 font-medium">tasks</span></p>
                    </AppCard>
                    <AppCard className="p-5 border-indigo-100 bg-indigo-50/20 shadow-sm shadow-indigo-100/50">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                            <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-widest">Completion</p>
                        </div>
                        <p className="text-2xl font-bold text-indigo-700">{stats.progress}% <span className="text-xs text-indigo-400 font-medium tracking-normal">rate</span></p>
                    </AppCard>
                </div>
            </div>



            
            <div className="flex flex-col gap-4 mb-6 flex-shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Title + Desktop Tabs */}
                    <div className="flex items-center gap-6">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{activeTab === 'overview' ? 'Overview' : 'My Tasks'}</h1>
                        
                        {/* Desktop Tabs - Inline with title */}
                        {activeTab === 'todos' && (
                             <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200/60">
                                <button 
                                    onClick={() => setTodoTab('active')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        todoTab === 'active' 
                                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                                >
                                    Active
                                </button>
                                <button 
                                    onClick={() => setTodoTab('completed')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                        todoTab === 'completed' 
                                            ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200' 
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                    }`}
                                >
                                    Completed
                                </button>
                             </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    {activeTab === 'todos' && (
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Mobile Tabs - Full width on small screens */}
                            <div className="md:hidden flex flex-1 bg-slate-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setTodoTab('active')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${todoTab === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Active
                                </button>
                                <button 
                                    onClick={() => setTodoTab('completed')}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${todoTab === 'completed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Completed
                                </button>
                            </div>


                            
                            {/* View Toggle - Hidden on mobile if needed, or keep */}
                            <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg items-center border border-slate-200">
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

                            <button onClick={() => { resetForm(); setShowAdd(true); }} className="btn-primary flex-shrink-0 !rounded-lg !py-2 !px-4 hover:shadow-md transition-all flex items-center gap-2">
                                <ICONS.Plus className="w-4 h-4" />
                                <span className="text-sm font-bold hidden sm:inline">New Task</span>
                                <span className="sm:hidden">Add</span>
                            </button>
                        </div>
                    )}

                </div>


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
                         <RenderTaskGroup title="Overdue" tasks={boardGroups.overdue} icon={ICONS.Calendar} colorClass="text-rose-600" bgClass="" />
                         <RenderTaskGroup title="Upcoming" tasks={boardGroups.upcoming} icon={ICONS.Check} colorClass="text-indigo-600" bgClass="" />
                         <RenderTaskGroup title="Completed" tasks={boardGroups.completed} icon={ICONS.CheckCircle} colorClass="text-emerald-600" bgClass="" />
                     </div>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    {/* Integrated Toolbar */}
                     <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-slate-100 bg-white">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search tasks..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 font-medium"
                            />
                        </div>

                        {/* Group By Control */}
                        <div className="flex items-center gap-3 pl-0 md:pl-4 md:border-l border-slate-100">
                            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Group by</span>
                            <div className="relative">
                                <select 
                                    value={groupBy}
                                    onChange={(e) => setGroupBy(e.target.value as any)}
                                    className="appearance-none pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:bg-slate-100 cursor-pointer transition-all"
                                >
                                    <option value="none">None</option>
                                    <option value="category">Category</option>
                                    <option value="priority">Priority</option>
                                    <option value="dueDate">Due Date</option>
                                </select>
                                <ICONS.ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                     </div>

                     {/* Scrollable Content */}
                     <div className="flex-1 overflow-auto custom-scrollbar p-0">  
                         {groupBy !== 'none' && groupedTodos ? (
                             <div className="space-y-8 p-4">
                                 {groupedTodos.map((group) => (
                                     <div key={group.title} className="space-y-3">
                                         <div className="flex items-center gap-2">
                                             <span className={`text-sm font-bold px-3 py-1 rounded-full border ${
                                                groupBy === 'priority' ? (
                                                    group.title === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    group.title === 'medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                ) : 'bg-slate-100 text-slate-800 border-slate-200'
                                             }`}>
                                                {group.title === 'high' || group.title === 'medium' || group.title === 'low' ? group.title.charAt(0).toUpperCase() + group.title.slice(1) : group.title}
                                             </span>
                                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800 text-white shadow-sm ring-2 ring-white ml-1">
                                                {group.todos.length}
                                              </span>
                                         </div>
                                         <RenderTableView todos={group.todos} />
                                     </div>
                                 ))}
                                 {filteredTodos.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 text-sm">No tasks found</div>
                                 )}
                             </div>
                         ) : (
                            <RenderTableView todos={paginatedTodos} />
                         )}
                     </div>
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
                             <CustomDatePicker 
                                value={dueDate}
                                onChange={setDueDate}
                                className="mt-2"
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
