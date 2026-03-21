import React, { useMemo } from 'react';
import { InsurancePolicy } from '../../types';
import { AppCard } from '../../components/ui/AppCard';

interface PolicyAnalyticsProps {
  policies: InsurancePolicy[];
}

const PolicyAnalytics: React.FC<PolicyAnalyticsProps> = ({ policies }) => {
  const stats = useMemo(() => {
    const active = policies.length;
    const totalPremium = policies.reduce((sum, p) => sum + p.premium, 0);
    
    const now = new Date();
    const expiredCount = policies.filter(p => new Date(p.expiryDate) < now).length;
    
    // Category Breakdown
    const healthCount = policies.filter(p => p.category.includes('Health')).length;
    const vehicleCount = policies.filter(p => p.category === 'Car' || p.category === 'Two-wheeler').length;
    const lifeCount = policies.filter(p => p.category.includes('Term')).length;
    const otherCount = active - healthCount - vehicleCount - lifeCount;

    return { active, totalPremium, expiredCount, healthCount, vehicleCount, lifeCount, otherCount };
  }, [policies]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AppCard className="p-5 bg-blue-50/50 border-blue-100" hoverEffect={false}>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Active Policies</p>
          <p className="text-3xl font-black text-blue-900">{stats.active}</p>
        </AppCard>
        <AppCard className="p-5" hoverEffect={false}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Premium</p>
          <p className="text-3xl font-black text-gray-800">₹{stats.totalPremium.toLocaleString('en-IN')}</p>
        </AppCard>
        <AppCard className="p-5" hoverEffect={false}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Expired</p>
          <p className="text-3xl font-black text-rose-600">{stats.expiredCount}</p>
        </AppCard>
        <AppCard className="p-5" hoverEffect={false}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Protection Index</p>
          <p className="text-3xl font-black text-emerald-600">{stats.active > 0 ? 'Optimal' : '-'}</p>
        </AppCard>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
              { label: 'Health', value: stats.healthCount, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Vehicle', value: stats.vehicleCount, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Life', value: stats.lifeCount, color: 'text-violet-600', bg: 'bg-violet-50' },
              { label: 'Other', value: stats.otherCount, color: 'text-gray-600', bg: 'bg-gray-50' }
          ].map((cat) => (
              <div key={cat.label} className={`p-4 rounded-xl border border-gray-100 ${cat.bg} flex flex-col items-center justify-center text-center`}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{cat.label}</p>
                  <p className={`text-2xl font-black ${cat.color}`}>{cat.value}</p>
              </div>
          ))}
      </div>
    </div>
  );
};

export default PolicyAnalytics;
