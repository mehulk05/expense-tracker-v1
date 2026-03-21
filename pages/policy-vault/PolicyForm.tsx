import React, { useState, useEffect } from 'react';
import { InsurancePolicy, InsuranceCategory } from '../../types';
import SidePopover from '../../components/SidePopover';
import { AppButton } from '../../components/ui/AppButton';
import { CustomDatePicker } from '../../components/ui/CustomDatePicker';
import { storage } from '../../services/storage';
import { useToast } from '../../context/ToastContext';

interface PolicyFormProps {
  initialData: InsurancePolicy | null;
  onSave: (policy: InsurancePolicy) => Promise<void>;
  onClose: () => void;
}

const CATEGORIES: InsuranceCategory[] = [
  'Health', 'Term', 'Car', 'Two-wheeler', "Wife's health", "Wife's term", "Parents' health", 'Other'
];

const PolicyForm: React.FC<PolicyFormProps> = ({ initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<InsurancePolicy>>({
    category: 'Health',
    name: '',
    policyNumber: '',
    year: new Date().getFullYear().toString(),
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    premium: 0,
    vehicleNumber: '',
    idv: 0,
    notes: ''
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const isVehicle = formData.category === 'Car' || formData.category === 'Two-wheeler';

  const validate = () => {
    if (isVehicle) {
      if (!formData.policyNumber || !formData.vehicleNumber || !formData.year) return false;
      if (!initialData?.pdfUrl && !pdfFile) return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please fill all mandatory fields for vehicle policies.', 'error');
      return;
    }

    setUploading(true);
    try {
      let pdfUrl = formData.pdfUrl || "";
      let pdfName = formData.pdfName || "";
      const id = initialData?.id || crypto.randomUUID();

      if (pdfFile) {
        try {
          pdfUrl = await storage.uploadPolicyPDF(id, pdfFile);
          pdfName = pdfFile.name;
        } catch (uploadError) {
          addToast('Failed to upload PDF. Please check your connection.', 'error');
          setUploading(false); // Reset loading state immediately on upload failure
          return; // Exit if upload fails
        }
      }

      const policy: InsurancePolicy = {
        ...(formData as InsurancePolicy),
        id,
        pdfUrl,
        pdfName,
        premium: formData.premium || 0,
        idv: formData.idv || 0,
        createdAt: initialData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onSave(policy);
    } catch (error: any) {
      console.error("Policy submission error:", error);
      addToast(error.message || 'Failed to save policy record', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SidePopover
      isOpen={true}
      onClose={onClose}
      title={initialData ? "Edit Policy" : "New Policy Entry"}
      subtitle="Fill in the details to track your insurance."
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        <div className="space-y-4">
          <div>
            <label className="label-professional">Category</label>
            <select 
              value={formData.category} 
              onChange={e => setFormData({ ...formData, category: e.target.value as InsuranceCategory })}
              className="input-professional font-bold"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div>
            <label className="label-professional">Policy Name / Label</label>
            <input 
              value={formData.name || ''} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input-professional" 
              placeholder="e.g. HDFC Ergo Health" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-professional">Policy Number {isVehicle && '*'}</label>
              <input 
                required={isVehicle}
                value={formData.policyNumber || ''} 
                onChange={e => setFormData({ ...formData, policyNumber: e.target.value })}
                className="input-professional" 
                placeholder="1234-5678-..." 
              />
            </div>
            <div>
              <label className="label-professional">Year {isVehicle && '*'}</label>
              <input 
                required={isVehicle}
                value={formData.year || ''} 
                onChange={e => setFormData({ ...formData, year: e.target.value })}
                className="input-professional" 
                placeholder="2025" 
              />
            </div>
          </div>

          {isVehicle && (
            <div>
              <label className="label-professional">Vehicle Number *</label>
              <input 
                required
                value={formData.vehicleNumber || ''} 
                onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                className="input-professional" 
                placeholder="MH 12 AB 1234" 
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-professional">Start Date</label>
              <CustomDatePicker 
                value={formData.startDate || ''} 
                onChange={d => setFormData({ ...formData, startDate: d })} 
              />
            </div>
            <div>
              <label className="label-professional">Expiry Date</label>
              <CustomDatePicker 
                value={formData.expiryDate || ''} 
                onChange={d => setFormData({ ...formData, expiryDate: d })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-professional">Premium Paid</label>
              <input 
                type="number"
                value={formData.premium ?? ''} 
                onChange={e => setFormData({ ...formData, premium: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="input-professional" 
                placeholder="0"
              />
            </div>
            <div>
              <label className="label-professional">IDV (Vehicle Only)</label>
              <input 
                type="number"
                value={formData.idv ?? ''} 
                onChange={e => setFormData({ ...formData, idv: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                className="input-professional font-bold"
                disabled={!isVehicle}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="label-professional">Policy PDF {isVehicle && '*'}</label>
            <div className="mt-2 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-all cursor-pointer relative">
                <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    <p className="text-xs font-bold text-gray-500">
                        {pdfFile ? pdfFile.name : (formData.pdfName || "Click to upload Policy PDF")}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">Only PDF files supported</p>
                </div>
            </div>
          </div>

          <div>
            <label className="label-professional">Notes</label>
            <textarea 
              value={formData.notes} 
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="input-professional min-h-[100px] resize-none" 
              placeholder="Any additional details..."
            />
          </div>
        </div>

        <div className="flex gap-4 pt-8 border-t border-gray-100 sticky bottom-0 bg-white pb-6 z-10">
          <AppButton variant="secondary" onClick={onClose} className="flex-1 !py-4 uppercase tracking-widest text-[10px]" disabled={uploading}>
            Cancel
          </AppButton>
          <AppButton type="submit" className="flex-1 !py-4 uppercase tracking-widest text-[10px] shadow-blue-200" disabled={uploading}>
            {uploading ? 'Uploading...' : (initialData ? 'Update Policy' : 'Save Policy')}
          </AppButton>
        </div>
      </form>
    </SidePopover>
  );
};

export default PolicyForm;
