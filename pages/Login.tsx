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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
        <div className="p-8 md:p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg shadow-blue-200">
              S
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SpendWise</h1>
            <p className="text-gray-500 mt-2 text-sm font-medium">Financial Command Center</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="animate-in slide-in-from-top-4 duration-300">
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Identity</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                  placeholder="Your Full Name"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email Access</label>
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                placeholder="identity@spendwise.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Secret Key</label>
              <input 
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-600 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                 <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                 {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-70"
            >
              {loading ? 'Authorizing...' : (isLogin ? 'Establish Session' : 'Register Profile')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-500 font-bold text-xs uppercase tracking-wide hover:text-blue-600 transition-colors py-2 px-4 rounded-lg hover:bg-gray-50"
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