"use client";
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { isUrdu, setIsUrdu } = useApp();
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem('user_role', data.role);
        // Direct redirect to dashboard
        window.location.href = '/admin/dashboard';
      } else {
        alert(isUrdu ? "غلط معلومات یا غیر مجاز رسائی!" : "Invalid Credentials or Unauthorized!");
        setFormData({ username: '', password: '' });
      }
    } catch (error) {
      alert("Security Error! Connection lost.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f1] p-4 font-sans">
      
      {/* Top Navigation Bar */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 px-4">
        <button 
          onClick={() => router.push('/')} 
          className="text-[#1a472a] font-bold text-[10px] uppercase tracking-widest hover:opacity-70 transition-all flex items-center gap-2"
        >
          ← {isUrdu ? "ہوم پیج" : "Back to Home"}
        </button>
        
        <button 
          onClick={() => setIsUrdu(!isUrdu)}
          className="bg-white border border-gray-200 px-3 py-1 rounded-full text-[9px] font-black text-[#1a472a] shadow-sm"
        >
          {isUrdu ? "ENGLISH" : "اردو"}
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[20px_20px_60px_#d1d9d4,-20px_-20px_60px_#ffffff] p-10 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#1a472a]/5 rounded-full"></div>
        
        <div className="text-center mb-10 relative">
          <div className="w-20 h-20 bg-[#1a472a] rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className={`text-2xl font-black text-[#1a472a] uppercase tracking-widest ${isUrdu ? 'font-urdu' : ''}`}>
            {isUrdu ? "محفوظ لاگ ان" : "Secure Login"}
          </h2>
          <p className="text-[9px] text-gray-400 font-bold mt-2 tracking-[0.3em] uppercase">
            {isUrdu ? "صرف مجاز عملہ" : "Authorized Personnel Only"}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-[#1a472a] uppercase px-2">{isUrdu ? "صارف کا نام" : "Username"}</label>
            <input 
              type="text" 
              placeholder="••••••••" 
              className="w-full p-4 rounded-xl bg-[#f0f4f1] shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] outline-none text-center font-bold text-[#1a472a]"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-[#1a472a] uppercase px-2">{isUrdu ? "پاس ورڈ" : "Password"}</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 rounded-xl bg-[#f0f4f1] shadow-[inset_2px_2px_5px_#d1d1d1,inset_-2px_-2px_5px_#ffffff] outline-none text-center font-bold text-[#1a472a]"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#1a472a] text-[#d4af37] py-5 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? (isUrdu ? "تصدیق ہو رہی ہے..." : "Authenticating...") : (isUrdu ? "پورٹل میں داخل ہوں" : "Enter Portal")}
          </button>
        </form>

        <p className="text-center mt-8 text-[8px] text-gray-300 font-bold uppercase tracking-widest">
          &copy; 2026 TOKEN SYSTEM | ENCRYPTED SESSION
        </p>
      </div>
    </div>
  );
}