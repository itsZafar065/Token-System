"use client";
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';

export default function ManageStaff() {
  const { isUrdu } = useApp();
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'staff' });

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff'); 
      const data = await res.json();
      if (data.success) setStaff(data.data);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEditing ? 'PATCH' : 'POST';
    const payload = isEditing ? { ...formData, id: isEditing } : formData;

    const res = await fetch('/api/staff', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    
    if (data.success) {
      setFormData({ name: '', username: '', password: '', role: 'staff' });
      setIsEditing(null);
      fetchStaff();
      alert(isUrdu ? "کامیابی سے محفوظ ہو گیا" : "Saved successfully!");
    } else { alert(data.message); }
  };

  const handleEditClick = (member) => {
    setIsEditing(member._id);
    setFormData({ name: member.name, username: member.username, password: '', role: member.role });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteStaff = async (id) => {
    if (!confirm(isUrdu ? "حذف کریں؟" : "Delete?")) return;
    try {
      const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' });
      if (res.ok) setStaff(prev => prev.filter(item => item._id !== id));
    } catch (error) { console.error("Error deleting"); }
  };

  return (
    <div className={`min-h-screen bg-[#f3f6f3] pb-10 overflow-x-hidden ${isUrdu ? 'font-urdu' : ''}`} dir={isUrdu ? "rtl" : "ltr"}>
      
      {/* HEADER - Responsive Full Width */}
      <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50 px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button onClick={() => router.back()} className="text-[#1a472a] p-2 hover:bg-gray-100 rounded-lg">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="text-xs font-black text-[#1a472a] uppercase tracking-tighter">
            {isUrdu ? "ٹیم مینجمنٹ" : "Staff Management"}
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* MAIN CONTAINER - Fluid Width for all mobiles */}
      <div className="w-[94%] max-w-md mx-auto mt-6 space-y-6">
        
        {/* ADD / EDIT FORM - Soft 3D */}
        <div className="bg-[#f3f6f3] rounded-[2rem] p-5 shadow-[8px_8px_16px_#d1d9d1,-8px_-8px_16px_#ffffff] border border-white/40 transition-all">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-5 px-1">
            {isEditing ? (isUrdu ? "ممبر تبدیل کریں" : "Edit Member") : (isUrdu ? "نیا ممبر" : "Add Member")}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder={isUrdu ? "نام" : "Name"} 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="w-full p-4 bg-[#f3f6f3] shadow-inner rounded-2xl outline-none text-sm border border-white/20 focus:border-[#1a472a]/20" 
              required 
            />
            
            <input 
              type="text" 
              placeholder={isUrdu ? "یوزرنیم" : "Username"} 
              value={formData.username} 
              readOnly={!!isEditing}
              onChange={(e) => !isEditing && setFormData({...formData, username: e.target.value})} 
              className={`w-full p-4 rounded-2xl outline-none text-sm border border-white/20 shadow-inner ${isEditing ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-[#f3f6f3]'}`} 
              required 
            />

            <input 
              type="password" 
              placeholder={isEditing ? (isUrdu ? "پاس ورڈ (اختیاری)" : "New Password (Optional)") : (isUrdu ? "پاس ورڈ" : "Password")} 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              className="w-full p-4 bg-[#f3f6f3] shadow-inner rounded-2xl outline-none text-sm border border-white/20" 
              required={!isEditing} 
            />

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => setFormData({...formData, role: 'staff'})} 
                className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-[4px_4px_8px_#d1d9d1,-4px_-4px_8px_#ffffff] ${formData.role === 'staff' ? 'bg-[#1a472a] text-white shadow-inner' : 'bg-[#f3f6f3] text-gray-400'}`}
              >Staff</button>
              <button 
                type="button" 
                onClick={() => setFormData({...formData, role: 'admin'})} 
                className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-[4px_4px_8px_#d1d9d1,-4px_-4px_8px_#ffffff] ${formData.role === 'admin' ? 'bg-amber-600 text-white shadow-inner' : 'bg-[#f3f6f3] text-gray-400'}`}
              >Admin</button>
            </div>

            <div className="flex gap-3 pt-2">
              {isEditing && (
                <button type="button" onClick={() => {setIsEditing(null); setFormData({name:'', username:'', password:'', role:'staff'})}} className="flex-1 bg-white text-gray-400 py-4 rounded-2xl font-black text-[10px] shadow-sm uppercase border border-gray-100">Cancel</button>
              )}
              <button type="submit" className="flex-[2] bg-[#1a472a] text-[#d4af37] py-4 rounded-2xl font-black uppercase text-[10px] shadow-[6px_6px_12px_#d1d9d1,-6px_-6px_12px_#ffffff] active:scale-95 transition-all">
                {isEditing ? "Update Staff" : "Register Member"}
              </button>
            </div>
          </form>
        </div>

        {/* STAFF LIST - Cards optimized for small width */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-[#1a472a] uppercase tracking-widest">{isUrdu ? "ٹیم لسٹ" : "Active Staff"}</h3>
            <span className="text-[9px] font-bold text-gray-400">{staff.length} Active</span>
          </div>

          {loading ? (
            <div className="text-center p-10 font-black text-gray-300 animate-pulse text-xs">LOADING...</div>
          ) : (
            <div className="grid gap-3 pb-20">
              {staff.map((s) => (
                <div key={s._id} className="bg-[#f3f6f3] p-3 rounded-[1.5rem] shadow-[6px_6px_12px_#d1d9d1,-6px_-6px_12px_#ffffff] flex justify-between items-center border border-white/30">
                  <div className="flex items-center gap-3 min-w-0" onClick={() => handleEditClick(s)}>
                    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-white text-xs ${s.role === 'admin' ? 'bg-amber-600' : 'bg-[#1a472a]'}`}>
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="font-black text-[#1a472a] text-[11px] uppercase truncate">{s.name}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase truncate">@{s.username} • {s.role}</p>
                    </div>
                  </div>
                  
                  {/* Small Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    <button onClick={() => handleEditClick(s)} className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center active:bg-blue-500 active:text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => deleteStaff(s._id)} className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center active:bg-red-500 active:text-white">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}