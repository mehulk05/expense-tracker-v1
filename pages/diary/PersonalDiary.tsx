import React, { useState, useEffect, useMemo } from 'react';
import { DiaryEntry, DiarySettings } from '../../types';
import { storage } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import DiaryLockScreen from './DiaryLockScreen';
import DiaryForm from './DiaryForm';
import DiaryList from './DiaryList';
import DiaryAnalytics from './DiaryAnalytics';
import { AppButton } from '../../components/ui/AppButton';

type TimeRange = 'this-month' | 'last-month' | 'this-year' | 'all-time';

const PersonalDiary: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [settings, setSettings] = useState<DiarySettings | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('this-month');
  const { addToast } = useToast();

  const loadSettings = async () => {
    const s = await storage.getDiarySettings();
    setSettings(s);
    setLoading(false);
  };

  const loadEntries = async () => {
    const data = await storage.getDiaryEntries();
    setEntries(data);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    loadEntries();
  };

  const filteredEntries = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return entries.filter(e => {
        const d = new Date(e.date);
        if (timeRange === 'this-month') {
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        } else if (timeRange === 'last-month') {
            const lm = new Date(currentYear, currentMonth - 1, 1);
            return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
        } else if (timeRange === 'this-year') {
            return d.getFullYear() === currentYear;
        }
        return true; // all-time
    });
  }, [entries, timeRange]);

  const handleSetPIN = async (pin: string) => {
    await storage.setDiaryPIN(pin);
    setSettings({ hasPin: true, pinHash: pin });
  };

  const handleSave = async (entry: DiaryEntry) => {
    try {
      await storage.saveDiaryEntry(entry);
      setEntries(prev => {
        const exists = prev.find(e => e.id === entry.id);
        if (exists) return prev.map(e => e.id === entry.id ? entry : e);
        return [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date));
      });
      addToast('Diary entry saved', 'success');
      setShowForm(false);
      setEditingEntry(null);
    } catch (error) {
      addToast('Failed to save entry', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this entry?')) return;
    try {
      await storage.deleteDiaryEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      addToast('Entry deleted', 'success');
    } catch (error) {
      addToast('Failed to delete entry', 'error');
    }
  };

  if (loading) {
    return <div className="h-64 skeleton rounded-2xl w-full"></div>;
  }

  if (!isUnlocked) {
    return (
      <DiaryLockScreen 
        isFirstTime={!settings?.hasPin}
        onUnlock={handleUnlock}
        onSetPIN={handleSetPIN}
        savedPINHash={settings?.pinHash}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Personal Diary</h1>
          <p className="text-gray-500 font-medium">Your private space for reflection and mood tracking.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex overflow-x-auto text-[10px] font-black no-scrollbar uppercase tracking-widest">
                {(['this-month', 'last-month', 'this-year', 'all-time'] as const).map(range => (
                    <button 
                        key={range}
                        onClick={() => setTimeRange(range)} 
                        className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all ${timeRange === range ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {range.replace('-', ' ')}
                    </button>
                ))}
            </div>

            <div className="flex gap-2">
                <AppButton 
                    variant="secondary" 
                    onClick={() => setIsUnlocked(false)}
                    className="!text-[10px] uppercase font-black tracking-widest"
                >
                    Lock
                </AppButton>
                <AppButton 
                    onClick={() => {
                        setEditingEntry(null);
                        setShowForm(true);
                    }}
                    className="shadow-indigo-200"
                >
                    New Entry
                </AppButton>
            </div>
        </div>
      </div>

      <DiaryAnalytics entries={filteredEntries} />

      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                Journal Feed
                <span className="text-[10px] font-black px-2 py-1 bg-gray-100 text-gray-400 rounded-full">{filteredEntries.length}</span>
            </h2>
        </div>
        <DiaryList 
          entries={filteredEntries} 
          onEdit={(e) => {
            setEditingEntry(e);
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      {showForm && (
        <DiaryForm
          initialData={editingEntry}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
        />
      )}
    </div>
  );
};

export default PersonalDiary;
