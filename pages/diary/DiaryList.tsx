import React, { useState } from 'react';
import { DiaryEntry } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { ICONS } from '../../constants';

interface DiaryListProps {
  entries: DiaryEntry[];
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
}

const MOOD_MAP: Record<string, string> = {
  Happy: '😊', Sad: '😢', Tired: '🥱', Angry: '😠',
  Lonely: '👤', Calm: '😌', Stressed: '😫', Excited: '🤩',
  Grateful: '🙏', Motivated: '💪', Neutral: '😐', Anxious: '😰'
};

const DiaryList: React.FC<DiaryListProps> = ({ entries, onEdit, onDelete }) => {
  const [filter, setFilter] = useState('All');

  const filteredEntries = entries.filter(e => {
      if (filter === 'All') return true;
      if (filter === 'Favorites') return e.isFavorite;
      return e.mood === filter;
  });

  if (entries.length === 0) {
    return (
      <AppCard className="p-16 text-center border-dashed border-2 border-gray-100 bg-transparent">
        <div className="w-20 h-20 bg-blue-50/50 rounded-full flex items-center justify-center text-blue-200 mx-auto mb-6">
          <ICONS.CheckCircle className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Dear Diary...</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Start with your first entry and track how you feel over time.
        </p>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-xl border border-gray-100 self-start inline-flex shadow-sm mb-2 overflow-x-auto max-w-full">
        {['All', 'Favorites', ...Object.keys(MOOD_MAP).slice(0, 5)].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === f 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <AppCard 
            key={entry.id} 
            className="p-6 relative overflow-hidden group border-none shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
            hoverEffect={true}
          >
            <div className="flex gap-6 items-start">
              <div className="flex flex-col items-center">
                <div className="text-3xl mb-2 bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  {MOOD_MAP[entry.mood] || '😐'}
                </div>
                {entry.isFavorite && (
                    <span className="text-amber-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                    </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                      {new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                        Feeling {entry.mood}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(entry)}
                        className="p-2 text-gray-300 hover:text-blue-600 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    </button>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                    >
                        <ICONS.Trash className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {entry.note && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3 font-medium italic">
                    "{entry.note}"
                  </p>
                )}

                <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-50">
                    {entry.energy && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Energy</span>
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-3 h-1 rounded-full ${i < entry.energy! ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                                ))}
                            </div>
                        </div>
                    )}
                    {entry.stress && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stress</span>
                            <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-3 h-1 rounded-full ${i < entry.stress! ? 'bg-orange-400' : 'bg-gray-100'}`} />
                                ))}
                            </div>
                        </div>
                    )}
                    {entry.gratitude && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Highlight</span>
                            <span className="text-xs font-bold text-gray-700 max-w-[150px] truncate">{entry.gratitude}</span>
                        </div>
                    )}
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>
    </div>
  );
};

export default DiaryList;
