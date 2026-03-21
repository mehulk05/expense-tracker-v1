import React, { useState, useEffect } from 'react';
import { NTMRecord, NTSRecord } from '../../types';
import SidePopover from '../../components/SidePopover';
import { AppButton } from '../../components/ui/AppButton';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';

interface PrivateTrackerFormProps {
  type: 'NTM' | 'NTS';
  initialData: NTMRecord | NTSRecord | null;
  onSave: (record: any) => void;
  onClose: () => void;
}

const PrivateTrackerForm: React.FC<PrivateTrackerFormProps> = ({ type, initialData, onSave, onClose }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [count, setCount] = useState('1');
  const [participants, setParticipants] = useState<1 | 2>(1);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setCount(initialData.count.toString());
      if (type === 'NTS') {
        setParticipants((initialData as NTSRecord).participants);
      } else {
        setNote((initialData as NTMRecord).note || '');
      }
    }
  }, [initialData, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericCount = parseInt(count);
    if (isNaN(numericCount) || numericCount < 1) return;

    const record = {
      id: initialData?.id || crypto.randomUUID(),
      date,
      count: numericCount,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(type === 'NTS' ? { participants } : { note })
    };

    onSave(record);
  };

  return (
    <SidePopover
      isOpen={true}
      onClose={onClose}
      title={`${initialData ? 'Edit' : 'New'} ${type} Entry`}
      subtitle="Track your activity privately."
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-100 shadow-inner text-center">
            <label className="label-professional">Count</label>
            <div className="flex items-center justify-center gap-6 mt-2">
                <button 
                    type="button" 
                    onClick={() => setCount(Math.max(1, parseInt(count) - 1).toString())}
                    className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl font-black text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                >
                    −
                </button>
                <input 
                  required 
                  type="number" 
                  value={count} 
                  onChange={e => setCount(e.target.value)} 
                  className="w-24 text-center text-4xl font-black text-blue-600 bg-transparent outline-none" 
                  min="1"
                />
                <button 
                    type="button" 
                    onClick={() => setCount((parseInt(count) + 1).toString())}
                    className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl font-black text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
                >
                    +
                </button>
            </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="label-professional">Date</label>
            <CustomDatePicker value={date} onChange={setDate} className="mt-2" />
          </div>

          {type === 'NTS' && (
            <div>
              <label className="label-professional">Participants</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[1, 2].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setParticipants(p as 1 | 2)}
                    className={`py-3 rounded-lg text-sm font-bold border transition-all ${
                      participants === p
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {p} {p === 1 ? 'Person' : 'Persons'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'NTM' && (
            <div>
              <label className="label-professional">Optional Note</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                className="input-professional mt-1 min-h-[100px] resize-none"
                placeholder="Add any private notes here..."
              />
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-8 border-t border-gray-100">
          <AppButton variant="secondary" onClick={onClose} className="flex-1 !py-4 uppercase tracking-widest text-[10px]">
            Cancel
          </AppButton>
          <AppButton type="submit" className="flex-1 !py-4 uppercase tracking-widest text-[10px] shadow-blue-200">
            {initialData ? 'Update' : 'Save'} Record
          </AppButton>
        </div>
      </form>
    </SidePopover>
  );
};

export default PrivateTrackerForm;
