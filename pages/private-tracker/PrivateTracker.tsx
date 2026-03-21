import React, { useState, useEffect } from 'react';
import { NTMRecord, NTSRecord } from '../../types';
import { storage } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import PrivateTrackerForm from './PrivateTrackerForm';
import PrivateTrackerList from './PrivateTrackerList'; // Will create this too
import PrivateTrackerAnalytics from './PrivateTrackerAnalytics';

const PrivateTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NTM' | 'NTS'>('NTM');
  const [ntmRecords, setNtmRecords] = useState<NTMRecord[]>([]);
  const [ntsRecords, setNtsRecords] = useState<NTSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<NTMRecord | NTSRecord | null>(null);
  const { addToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [ntm, nts] = await Promise.all([
        storage.getNTMRecords(),
        storage.getNTSRecords()
      ]);
      setNtmRecords(ntm);
      setNtsRecords(nts);
    } catch (error) {
      addToast('Failed to load records', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (record: NTMRecord | NTSRecord) => {
    try {
      if (activeTab === 'NTM') {
        await storage.saveNTMRecord(record as NTMRecord);
        setNtmRecords(prev => {
          const exists = prev.find(r => r.id === record.id);
          if (exists) return prev.map(r => r.id === record.id ? (record as NTMRecord) : r);
          return [record as NTMRecord, ...prev];
        });
      } else {
        await storage.saveNTSRecord(record as NTSRecord);
        setNtsRecords(prev => {
          const exists = prev.find(r => r.id === record.id);
          if (exists) return prev.map(r => r.id === record.id ? (record as NTSRecord) : r);
          return [record as NTSRecord, ...prev];
        });
      }
      addToast('Record saved successfully', 'success');
      setShowForm(false);
      setEditingRecord(null);
    } catch (error) {
      addToast('Failed to save record', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      if (activeTab === 'NTM') {
        await storage.deleteNTMRecord(id);
        setNtmRecords(prev => prev.filter(r => r.id !== id));
      } else {
        await storage.deleteNTSRecord(id);
        setNtsRecords(prev => prev.filter(r => r.id !== id));
      }
      addToast('Record deleted successfully', 'success');
    } catch (error) {
      addToast('Failed to delete record', 'error');
    }
  };

  const handleEdit = (record: NTMRecord | NTSRecord) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 skeleton rounded-xl w-48"></div>
        <div className="h-64 skeleton rounded-xl w-full"></div>
        <div className="h-96 skeleton rounded-xl w-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Private Tracker</h1>
          <p className="text-gray-500 font-medium">Monitor your metrics discreetly.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {(['NTM', 'NTS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setShowForm(false);
                setEditingRecord(null);
              }}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <PrivateTrackerAnalytics 
        type={activeTab} 
        records={activeTab === 'NTM' ? ntmRecords : ntsRecords} 
      />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Records</h2>
        <AppButton 
          onClick={() => {
            setEditingRecord(null);
            setShowForm(true);
          }}
          className="shadow-blue-200"
        >
          Add Entry
        </AppButton>
      </div>

      <PrivateTrackerList 
        type={activeTab} 
        records={activeTab === 'NTM' ? ntmRecords : ntsRecords} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showForm && (
        <PrivateTrackerForm
          type={activeTab}
          initialData={editingRecord}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingRecord(null);
          }}
        />
      )}
    </div>
  );
};

export default PrivateTracker;
