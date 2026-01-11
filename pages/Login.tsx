
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
    <div className="min-h-screen flex items-center justify-center bg-[#fcfcfd] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-slate-100">
        <div className="p-10 md:p-14">
          <div className="flex flex-col items-center mb-12">
            <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-2xl mb-4 shadow-xl shadow-slate-900/10">
              S
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">SpendWise</h1>
            <p className="text-slate-400 mt-2 text-xs font-bold uppercase tracking-widest">Financial Command Center</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Identity</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="input-professional"
                  placeholder="Your Full Name"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Access</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input-professional"
                placeholder="identity@spendwise.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Secret Key</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="input-professional"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-rose-600 text-[11px] font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}

            <button 
              type="submit"
              disabled={loading}
              className="w-full btn-primary !py-4 text-xs uppercase tracking-widest"
            >
              {loading ? 'Authenticating...' : (isLogin ? 'Establish Session' : 'Create Profile')}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
            >
              {isLogin ? "Join the network" : 'Return to login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
