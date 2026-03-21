import React, { useState, useEffect } from 'react';
import { DiaryEntry } from '../../types';
import SidePopover from '../../components/SidePopover';
import { AppButton } from '../../components/ui/AppButton';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';

interface DiaryFormProps {
  initialData: DiaryEntry | null;
  onSave: (entry: DiaryEntry) => void;
  onClose: () => void;
}

const MOODS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Tired', emoji: '🥱' },
  { label: 'Angry', emoji: '😠' },
  { label: 'Lonely', emoji: '👤' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Stressed', emoji: '😫' },
  { label: 'Excited', emoji: '🤩' },
  { label: 'Grateful', emoji: '🙏' },
  { label: 'Motivated', emoji: '💪' },
  { label: 'Neutral', emoji: '😐' },
  { label: 'Anxious', emoji: '😰' }
];

const DiaryForm: React.FC<DiaryFormProps> = ({ initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<DiaryEntry>>({
    date: new Date().toISOString().split('T')[0],
    mood: 'Calm',
    note: '',
    energy: 3,
    stress: 2,
    sleep: 3,
    gratitude: '',
    challenge: '',
    tags: [],
    isFavorite: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mood || !formData.date) return;

    const entry: DiaryEntry = {
      ...(formData as DiaryEntry),
      id: initialData?.id || crypto.randomUUID(),
      tags: formData.tags || [],
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(entry);
  };

  const LevelOption: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
            <span className="text-xs font-bold text-blue-600">{value}/5</span>
        </div>
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(v => (
                <button
                    key={v}
                    type="button"
                    onClick={() => onChange(v)}
                    className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${
                        value === v ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                >
                    {v}
                </button>
            ))}
        </div>
    </div>
  );

  return (
    <SidePopover
      isOpen={true}
      onClose={onClose}
      title={initialData ? "Edit Reflection" : "New Diary Entry"}
      subtitle="Take a moment to check in with yourself."
    >
      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-professional">Date</label>
              <CustomDatePicker 
                value={formData.date || ''} 
                onChange={d => setFormData({ ...formData, date: d })} 
              />
            </div>
            <div className="flex items-end justify-end">
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                  className={`p-3 rounded-xl border transition-all ${
                    formData.isFavorite ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-400'
                  }`}
                >
                  <svg className="w-5 h-5" fill={formData.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                </button>
            </div>
          </div>

          <div>
            <label className="label-professional block mb-3">How are you feeling?</label>
            <div className="grid grid-cols-4 gap-3">
              {MOODS.map(m => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood: m.label })}
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                    formData.mood === m.label 
                      ? 'bg-blue-50 border-blue-400 shadow-sm' 
                      : 'bg-white border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-1">{m.emoji}</span>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    formData.mood === m.label ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <LevelOption 
                label="Energy Level" 
                value={formData.energy || 3} 
                onChange={v => setFormData({ ...formData, energy: v })} 
            />
            <LevelOption 
                label="Stress Level" 
                value={formData.stress || 2} 
                onChange={v => setFormData({ ...formData, stress: v })} 
            />
            <LevelOption 
                label="Sleep Quality" 
                value={formData.sleep || 3} 
                onChange={v => setFormData({ ...formData, sleep: v })} 
            />
          </div>

          <div>
            <label className="label-professional">Journal Narrative</label>
            <textarea 
              value={formData.note} 
              onChange={e => setFormData({ ...formData, note: e.target.value })}
              className="input-professional min-h-[120px] resize-none text-sm leading-relaxed" 
              placeholder="What's on your mind today?"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-professional">Highlight (Gratitude)</label>
              <input 
                value={formData.gratitude} 
                onChange={e => setFormData({ ...formData, gratitude: e.target.value })}
                className="input-professional text-xs" 
                placeholder="One good thing..."
              />
            </div>
            <div>
              <label className="label-professional">Challenge</label>
              <input 
                value={formData.challenge} 
                onChange={e => setFormData({ ...formData, challenge: e.target.value })}
                className="input-professional text-xs" 
                placeholder="What felt difficult?"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-8 border-t border-gray-100 sticky bottom-0 bg-white pb-6 z-10">
          <AppButton variant="secondary" onClick={onClose} className="flex-1 !py-4 uppercase tracking-widest text-[10px]">
            Cancel
          </AppButton>
          <AppButton type="submit" className="flex-1 !py-4 uppercase tracking-widest text-[10px] shadow-blue-200">
            {initialData ? 'Update Reflection' : 'Save Entry'}
          </AppButton>
        </div>
      </form>
    </SidePopover>
  );
};

export default DiaryForm;
