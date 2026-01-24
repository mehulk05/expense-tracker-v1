import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 overflow-hidden border border-slate-200 transform transition-all hover:shadow-indigo-900/20">
        <div className="p-12 md:p-16">
          <div className="flex flex-col items-center mb-16">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl mb-6 shadow-xl shadow-indigo-400/30">
              S
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">SpendWise</h1>
            <p className="text-slate-400 mt-3 text-[10px] font-black uppercase tracking-[0.4em]">Financial Command Center</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {!isLogin && (
              <div className="animate-in slide-in-from-top-4 duration-300">
                <label className="label-professional">Identity</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="input-professional !py-4"
                  placeholder="Your Full Name"
                />
              </div>
            )}
            <div>
              <label className="label-professional">Email Access</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-professional !py-4"
                placeholder="identity@spendwise.com"
              />
            </div>
            <div>
              <label className="label-professional">Secret Key</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="input-professional !py-4"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-rose-600 text-[11px] font-bold bg-rose-50 p-4 rounded-xl border border-rose-200 flex items-center gap-3">
                 <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                 {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full btn-primary !py-5 text-xs uppercase tracking-[0.2em] shadow-indigo-300 active:scale-95"
            >
              {loading ? 'Authorizing...' : (isLogin ? 'Establish Session' : 'Register Profile')}
            </button>
          </form>

          <div className="mt-12 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-colors py-2 px-4 rounded-lg hover:bg-slate-50"
            >
              {isLogin ? "Initialize New User" : 'Return to Login Gateway'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;