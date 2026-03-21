import React, { useState } from 'react';
import { ICONS } from '../../constants';
import { AppButton } from '../../components/ui/AppButton';
import { useToast } from '../../context/ToastContext';

interface DiaryLockScreenProps {
  isFirstTime: boolean;
  onUnlock: () => void;
  onSetPIN: (pin: string) => Promise<void>;
  savedPINHash?: string;
}

const DiaryLockScreen: React.FC<DiaryLockScreenProps> = ({ isFirstTime, onUnlock, onSetPIN, savedPINHash }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(isFirstTime ? 'setup' : 'unlock');
  const { addToast } = useToast();

  const handleAction = async () => {
    if (step === 'setup') {
      if (pin.length < 4) {
        addToast('PIN must be at least 4 digits.', 'error');
        return;
      }
      setStep('confirm');
      setConfirmPin('');
    } else if (step === 'confirm') {
      if (pin !== confirmPin) {
        addToast('PINs do not match.', 'error');
        setStep('setup');
        setPin('');
        return;
      }
      await onSetPIN(pin);
      addToast('PIN set successfully', 'success');
      onUnlock();
    } else if (step === 'unlock') {
      // In a real app we'd compare hashes, for now a simple check
      if (pin === savedPINHash) {
        onUnlock();
      } else {
        addToast('Incorrect PIN. Access Denied.', 'error');
        setPin('');
      }
    }
  };

  const addDigit = (digit: string) => {
    if (step === 'confirm') {
        if (confirmPin.length < 4) setConfirmPin(prev => prev + digit);
    } else {
        if (pin.length < 4) setPin(prev => prev + digit);
    }
  };

  const removeDigit = () => {
    if (step === 'confirm') {
        setConfirmPin(prev => prev.slice(0, -1));
    } else {
        setPin(prev => prev.slice(0, -1));
    }
  };

  const currentVal = step === 'confirm' ? confirmPin : pin;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
      <div className="max-w-xs w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
            <ICONS.CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {step === 'setup' ? 'Set Diary PIN' : step === 'confirm' ? 'Confirm PIN' : 'Access Diary'}
            </h1>
            <p className="text-gray-500 font-medium text-sm mt-1">
              {step === 'setup' ? 'Create a 4-digit PIN for your diary.' : step === 'confirm' ? 'Enter the PIN again to confirm.' : 'Your diary is protected. Enter your 4-digit PIN.'}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-center gap-4 h-4">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  i < currentVal.length ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 px-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0].map((val, i) => (
              val === '' ? <div key={i} /> : (
                <button
                  key={i}
                  onClick={() => addDigit(val.toString())}
                  className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-xl font-black text-gray-800 hover:bg-gray-50 hover:border-blue-200 transition-all shadow-sm active:scale-95"
                >
                  {val}
                </button>
              )
            ))}
            <button
               onClick={removeDigit}
               className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
            >
                <ICONS.Trash className="w-6 h-6" />
            </button>
          </div>

          <div className="pt-4">
            <AppButton 
                onClick={handleAction} 
                className="w-full !py-4 shadow-blue-200 uppercase tracking-widest text-xs font-black"
                disabled={currentVal.length !== 4}
            >
              {step === 'confirm' ? 'Confirm & Finish' : step === 'setup' ? 'Next' : 'Unlock Now'}
            </AppButton>
            {step === 'confirm' && (
                <button 
                    onClick={() => setStep('setup')} 
                    className="mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                >
                    Back to Setup
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryLockScreen;
