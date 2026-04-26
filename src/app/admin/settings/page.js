"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { isUrdu } = useApp();
  const router = useRouter();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '', username: '', password: '', role: 'staff'
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/manage'); // Is API ki route hum agle step mein banayenge
      const data = await res.json();
      if (data.success) setAdmins(data.admins);
    } catch (error) {
      console.error("Fetch Admins Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch('/api/admin/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });
      const data = await res.json();
      if (data.success) {
        alert(isUrdu ? "کامیابی سے شامل کر دیا گیا" : "Admin added successfully!");
        setNewAdmin({ name: '', username: '', password: '', role: 'staff' });
        fetchAdmins();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("System Error!");
    } finally {
      setFormLoading(false);
    }
  };

  const deleteAdmin = async (id) => {
    if (!confirm(isUrdu ? "کیا آپ اسے حذف کرنا چاہتے ہیں؟" : "Are you sure?")) return;
    try {
      await fetch(`/api/admin/manage?id=${id}`, { method: 'DELETE' });
      fetchAdmins();
    } catch (error) {
      alert("Delete failed");
    }
  };

  return (
    <div className={`min-h-screen bg-[#FDFCF0] pb-20 ${isUrdu ? 'font-urdu' : 'font-sans'}`}>
      {/* Header */}
      <nav className="bg-[#0D4D33] p-6 flex justify-between items-center shadow-2xl">
        <button onClick={() => router.back()} className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
          ⬅️ {isUrdu ? "واپس" : "Back"}
        </button>
        <h1 className="text-[#fbbf24] font-black text-sm md:text-lg uppercase tracking-tighter text-center">
          {isUrdu ? "انتظامی ترتیبات" : "Management Settings"}
        </h1>
        <div className="w-10"></div>
      </nav>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* ADD NEW ADMIN FORM */}
        <div className="bg-white rounded-[3rem] shadow-xl border-t-8 border-[#D47E1B] p-8">
          <h2 className="text-[#0D4D33] font-black text-xl mb-6 flex items-center gap-3 border-b-2 border-gray-50 pb-4">
            <span>👤</span> {isUrdu ? "نیا اسٹاف ممبر" : "Add New Staff"}
          </h2>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <input 
              type="text" required placeholder={isUrdu ? "پورا نام" : "Full Name"}
              value={newAdmin.name} onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
              className="w-full p-4 rounded-2xl bg-[#FDFCF0] border-2 border-transparent focus:border-[#0D4D33] outline-none font-bold text-sm"
            />
            <input 
              type="text" required placeholder={isUrdu ? "یوزر نیم" : "Username"}
              value={newAdmin.username} onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value.toLowerCase()})}
              className="w-full p-4 rounded-2xl bg-[#FDFCF0] border-2 border-transparent focus:border-[#0D4D33] outline-none font-bold text-sm"
            />
            <input 
              type="password" required placeholder={isUrdu ? "پاس ورڈ" : "Password"}
              value={newAdmin.password} onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
              className="w-full p-4 rounded-2xl bg-[#FDFCF0] border-2 border-transparent focus:border-[#0D4D33] outline-none font-bold text-sm"
            />
            <select 
              value={newAdmin.role} onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
              className="w-full p-4 rounded-2xl bg-[#FDFCF0] border-2 border-transparent focus:border-[#0D4D33] outline-none font-black text-sm uppercase"
            >
              <option value="staff">Staff</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button 
              type="submit" disabled={formLoading}
              className="w-full bg-[#0D4D33] text-[#fbbf24] py-5 rounded-[2rem] font-black uppercase text-xs shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              {formLoading ? "..." : (isUrdu ? "محفوظ کریں" : "Save Access")}
            </button>
          </form>
        </div>

        {/* STAFF LIST */}
        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border-t-8 border-[#800000]">
          <div className="p-6 bg-[#800000] text-white flex justify-between items-center">
            <h3 className="font-black text-xs uppercase tracking-widest">{isUrdu ? "اسٹاف لسٹ" : "Current Staff"}</h3>
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold">{admins.length} ACTIVE</span>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-10 text-center animate-pulse text-gray-300 font-black">LOADING...</div>
            ) : admins.length === 0 ? (
              <div className="p-10 text-center text-gray-400 font-bold italic">No Staff Added Yet</div>
            ) : (
              admins.map((admin) => (
                <div key={admin._id} className="p-5 flex justify-between items-center hover:bg-[#FDFCF0]/50 transition-colors">
                  <div>
                    <p className="text-[#0D4D33] font-black text-base">{admin.name}</p>
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] font-black text-[#D47E1B] uppercase tracking-tighter">@{admin.username}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                        {admin.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteAdmin(admin._id)}
                    className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}