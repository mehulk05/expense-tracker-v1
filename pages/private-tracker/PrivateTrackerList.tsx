import React from 'react';
import { NTMRecord, NTSRecord } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { ICONS } from '../../constants';

interface PrivateTrackerListProps {
  type: 'NTM' | 'NTS';
  records: (NTMRecord | NTSRecord)[];
  onEdit: (record: any) => void;
  onDelete: (id: string) => void;
}

const PrivateTrackerList: React.FC<PrivateTrackerListProps> = ({ type, records, onEdit, onDelete }) => {
  if (records.length === 0) {
    return (
      <AppCard className="p-16 text-center border-dashed border-2 border-gray-200 bg-transparent">
        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-6">
          <ICONS.List className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No entries yet</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Start tracking your activity privately and securely. Your records will appear here.
        </p>
      </AppCard>
    );
  }

  return (
    <div className="grid gap-4">
      {records.sort((a, b) => b.date.localeCompare(a.date)).map((record) => (
        <AppCard 
          key={record.id} 
          className="p-5 flex justify-between items-center group hover:border-blue-200"
          hoverEffect={true}
        >
          <div className="flex items-center gap-6">
            <div className="text-center min-w-[60px]">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {new Date(record.date).toLocaleDateString(undefined, { month: 'short' })}
              </p>
              <p className="text-2xl font-black text-gray-900 leading-tight">
                {new Date(record.date).getDate()}
              </p>
            </div>
            <div className="h-8 w-[1px] bg-gray-100 hidden sm:block"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-800">
                  {record.count} {type === 'NTM' ? 'count' : 'session'}
                </span>
                {type === 'NTS' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full">
                    {(record as NTSRecord).participants} { (record as NTSRecord).participants === 1 ? 'person' : 'persons' }
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium">
                {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long' })}
                {type === 'NTM' && (record as NTMRecord).note && ` • ${(record as NTMRecord).note.substring(0, 30)}...`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(record)}
              className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(record.id)}
              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
            >
              <ICONS.Trash className="w-4 h-4" />
            </button>
          </div>
        </AppCard>
      ))}
    </div>
  );
};

export default PrivateTrackerList;
