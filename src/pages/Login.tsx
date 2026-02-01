
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { LogIn, ShieldCheck, Mail, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      login(email);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 mb-6 rotate-3">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">CheckMaster</h1>
          <p className="text-slate-500 font-medium italic">Professional Auto Inspection</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="email" 
                placeholder="E-mail profissional"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-3xl py-4 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="password" 
                placeholder="Senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-3xl py-4 pl-12 pr-4 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-3xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Acessar Painel <LogIn size={20} />
          </button>

          <div className="text-center">
            <button type="button" className="text-slate-400 text-sm font-medium hover:text-indigo-600 transition-colors">
              Esqueceu sua senha?
            </button>
          </div>
        </form>

        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
          CheckMaster Auto v2.0
        </p>
      </div>
    </div>
  );
};

export default Login;
