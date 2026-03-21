import React, { useState, useEffect, useMemo } from 'react';
import { InsurancePolicy } from '../../types';
import { storage } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import { AppButton } from '../../components/ui/AppButton';
import PolicyForm from './PolicyForm';
import PolicyAnalytics from './PolicyAnalytics';
import PolicyList from './PolicyList';

const PolicyVault: React.FC = () => {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);
  const { addToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await storage.getPolicies();
      setPolicies(data);
    } catch (error) {
      addToast('Failed to load policies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (policy: InsurancePolicy) => {
    try {
      await storage.savePolicy(policy);
      setPolicies(prev => {
        const exists = prev.find(p => p.id === policy.id);
        if (exists) return prev.map(p => p.id === policy.id ? policy : p);
        return [policy, ...prev];
      });
      addToast('Policy saved successfully', 'success');
      setShowForm(false);
      setEditingPolicy(null);
    } catch (error) {
      addToast('Failed to save policy', 'error');
      throw error; // Rethrow so the form knows it failed
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy record?')) return;
    try {
      await storage.deletePolicy(id);
      setPolicies(prev => prev.filter(p => p.id !== id));
      addToast('Policy deleted successfully', 'success');
    } catch (error) {
      addToast('Failed to delete policy', 'error');
    }
  };

  const handleEdit = (policy: InsurancePolicy) => {
    setEditingPolicy(policy);
    setShowForm(true);
  };

  const expiringPolicies = useMemo(() => {
    const now = new Date();
    const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return policies.filter(p => {
        const expiry = new Date(p.expiryDate);
        return expiry <= next30Days;
    }).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
  }, [policies]);

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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Policy Vault</h1>
          <p className="text-gray-500 font-medium">Manage your insurance documents and renewals.</p>
        </div>
        <AppButton 
          onClick={() => {
            setEditingPolicy(null);
            setShowForm(true);
          }}
          className="shadow-blue-200"
        >
          Add Policy
        </AppButton>
      </div>

      {expiringPolicies.length > 0 && (
         <div className="space-y-4">
            <h2 className="text-sm font-bold text-rose-500 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Urgent Renewals Required
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {expiringPolicies.map(p => {
                   const expiry = new Date(p.expiryDate);
                   const now = new Date();
                   const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                   const isExpired = daysLeft < 0;

                   return (
                       <div key={p.id} className="bg-white border-2 border-rose-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                           <div className="flex justify-between items-start mb-3">
                               <span className="text-[10px] font-black px-2 py-1 bg-rose-50 text-rose-600 rounded-md uppercase tracking-wider">{p.category}</span>
                               <span className={`text-[10px] font-black ${isExpired ? 'text-rose-600' : 'text-amber-600'}`}>
                                   {isExpired ? 'EXPIRED' : `${daysLeft} DAYS LEFT`}
                               </span>
                           </div>
                           <p className="font-bold text-gray-900 mb-1">{p.name || `${p.category} Policy`}</p>
                           <p className="text-xs text-gray-500 font-medium mb-4">{p.policyNumber}</p>
                           <div className="flex justify-between items-center">
                               <p className="text-xs text-rose-600 font-bold">Expires: {new Date(p.expiryDate).toLocaleDateString()}</p>
                               <button 
                                onClick={() => handleEdit(p)}
                                className="text-[10px] font-bold text-blue-600 hover:underline"
                               >
                                   View Details
                               </button>
                           </div>
                       </div>
                   )
               })}
            </div>
         </div>
      )}

      <PolicyAnalytics policies={policies} />

      <div className="pt-4">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-6">Documents</h2>
        <PolicyList 
            policies={policies} 
            onEdit={handleEdit} 
            onDelete={handleDelete} 
        />
      </div>

      {showForm && (
        <PolicyForm
          initialData={editingPolicy}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingPolicy(null);
          }}
        />
      )}
    </div>
  );
};

export default PolicyVault;
