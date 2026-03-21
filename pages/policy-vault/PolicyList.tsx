import React, { useState } from 'react';
import { InsurancePolicy } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { ICONS } from '../../constants';

interface PolicyListProps {
  policies: InsurancePolicy[];
  onEdit: (policy: InsurancePolicy) => void;
  onDelete: (id: string) => void;
}

const PolicyList: React.FC<PolicyListProps> = ({ policies, onEdit, onDelete }) => {
  const [filter, setFilter] = useState('All');

  const filteredPolicies = policies.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Vehicle') return p.category === 'Car' || p.category === 'Two-wheeler';
    if (filter === 'Health') return p.category.includes('Health');
    return p.category === filter;
  });

  if (policies.length === 0) {
    return (
      <AppCard className="p-16 text-center border-dashed border-2 border-gray-200 bg-transparent">
        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-6">
          <ICONS.Document className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No policies yet</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Upload your first policy PDF and keep all renewals in one place.
        </p>
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 self-start inline-flex shadow-sm mb-2 overflow-x-auto max-w-full">
        {['All', 'Health', 'Vehicle', 'Term', 'Other'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              filter === f 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredPolicies.map((policy) => {
          const isVehicle = policy.category === 'Car' || policy.category === 'Two-wheeler';
          const now = new Date();
          const expiry = new Date(policy.expiryDate);
          const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = daysLeft < 0;
          const isUrgent = daysLeft >= 0 && daysLeft <= 30;

          return (
            <AppCard 
              key={policy.id} 
              className={`p-6 flex flex-col md:flex-row justify-between items-start md:items-center group border-l-4 transition-all ${
                isExpired ? 'border-l-rose-500' : isUrgent ? 'border-l-amber-500' : 'border-l-blue-500'
              }`}
              hoverEffect={true}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-1">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-center">
                    {isVehicle ? <ICONS.Bot className="w-6 h-6 text-gray-400" /> : <ICONS.Document className="w-6 h-6 text-gray-400" />}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">{policy.name || `${policy.category} Policy`}</h3>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider">{policy.category}</span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 font-medium">
                    <span>No: <span className="text-gray-700">{policy.policyNumber}</span></span>
                    {policy.vehicleNumber && <span>Vehicle: <span className="text-gray-700 uppercase">{policy.vehicleNumber}</span></span>}
                    <span>Year: <span className="text-gray-700">{policy.year}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mt-4 md:mt-0">
                <div className="text-left md:text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Premium</p>
                  <p className="font-black text-gray-900">₹{policy.premium.toLocaleString('en-IN')}</p>
                </div>
                
                <div className="text-left md:text-right">
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isExpired ? 'text-rose-500' : isUrgent ? 'text-amber-500' : 'text-gray-400'}`}>
                    {isExpired ? 'Expired' : 'Expires On'}
                  </p>
                  <p className="font-bold text-gray-700">{new Date(policy.expiryDate).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-2">
                  {policy.pdfUrl && (
                    <a 
                        href={policy.pdfUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="View PDF"
                    >
                        <ICONS.Document className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onEdit(policy)}
                    className="p-2.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-200 hover:text-gray-600 transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(policy.id)}
                    className="p-2.5 bg-rose-50 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    <ICONS.Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </AppCard>
          );
        })}
      </div>
    </div>
  );
};

export default PolicyList;
