"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import * as XLSX from 'xlsx';
import Pusher from 'pusher-js';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';

export default function AdminDashboard() {
  const { isUrdu, content } = useApp();
  const router = useRouter();
  
  const [tokens, setTokens] = useState([]);
  const [historyTokens, setHistoryTokens] = useState([]);
  const [allTokensRaw, setAllTokensRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  
  const [selectedToken, setSelectedToken] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('active'); 
  const [reportPreview, setReportPreview] = useState(false);

  // --- Schedule & Location States ---
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [activeDays, setActiveDays] = useState([]);
  const [officeLat, setOfficeLat] = useState(24.9525);
  const [officeLng, setOfficeLng] = useState(66.9549);
  const [radius, setRadius] = useState(500);
  const [isDetecting, setIsDetecting] = useState(false);
  // Naya State Toggle Button ke liye
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax";
      window.location.replace('/admin/login');
    } catch (error) {
      window.location.replace('/admin/login');
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/schedule', { method: 'PATCH' });
      const data = await res.json();
      if (data.success && data.data) {
        const s = data.data;
        setOpenTime(s.openTime || "09:00");
        setCloseTime(s.closeTime || "17:00");
        setActiveDays(s.activeDays || []);
        setOfficeLat(s.officeLat || 24.9525);
        setOfficeLng(s.officeLng || 66.9549);
        setRadius(s.radius || 500);
        setIsLocationEnabled(s.isLocationEnabled !== undefined ? s.isLocationEnabled : true);
      }
    } catch (e) { console.error("Schedule fetch error", e); }
  };

  const handleGetCurrentLocation = () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOfficeLat(position.coords.latitude.toFixed(6));
        setOfficeLng(position.coords.longitude.toFixed(6));
        setIsDetecting(false);
        alert(isUrdu ? "لوکیشن ڈیٹیکٹ ہو گئی ہے!" : "Current location detected!");
      },
      (error) => {
        setIsDetecting(false);
        alert(isUrdu ? "لوکیشن کی اجازت دیں" : "Please enable location access.");
      },
      { enableHighAccuracy: true }
    );
  };

  const saveSchedule = async () => {
    try {
      const res = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          openTime, 
          closeTime, 
          activeDays, 
          officeLat: parseFloat(officeLat), 
          officeLng: parseFloat(officeLng), 
          radius: parseInt(radius),
          isLocationEnabled // Ab ye bhi save hoga
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(isUrdu ? "سیٹنگز محفوظ ہو گئیں" : "Parameters Saved Successfully!");
        setShowSettings(false);
        fetchSchedule();
      } else {
        alert(data.message || "Error saving settings");
      }
    } catch (e) { 
      alert("Failed to save schedule"); 
    }
  };

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch(`/api/tokens?v=${new Date().getTime()}`);
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (data.success) {
        const allData = data.data;
        setAllTokensRaw(allData);
        setTokens(allData.filter(t => t.status === 'pending' || t.status === 'calling'));
        setHistoryTokens(allData.filter(t => t.status === 'completed' || t.status === 'cancelled'));
        setAnalytics(generateAnalytics(allData));
      }
    } catch (e) { console.error("Fetch Error:", e); } finally { setLoading(false); }
  }, []);

  const generateAnalytics = (all) => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      return { 
        name: d.toLocaleDateString('en-US', { weekday: 'short' }), 
        count: all.filter(t => new Date(t.createdAt).toDateString() === dayStr).length 
      };
    }).reverse();
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/tokens/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) fetchTokens();
    } catch (e) { alert("Action Failed"); }
  };

  const handleVoiceCall = (token) => {
    const text = isUrdu 
      ? `ٹوکن نمبر ${token.tokenNumber}، محترم ${token.name}، تشریف لائیں` 
      : `Token number ${token.tokenNumber}, Mr. ${token.name}, please proceed.`;
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = isUrdu ? 'ur-PK' : 'en-US';
    window.speechSynthesis.speak(msg);
    updateStatus(token._id, 'calling');
  };

  const downloadExcel = () => {
    const dataToExport = allTokensRaw.map(t => ({
      "Token": t.tokenNumber, "Name": t.name, "Phone": t.phone, "Residence": t.residence, "Issue": t.issue, "Status": t.status, "Date": new Date(t.createdAt).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XUtils.book_append_sheet(wb, ws, "Tokens");
    XLSX.writeFile(wb, `Token_System_Master_Report.xlsx`);
  };

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    setAdminRole(role || 'staff');
    fetchTokens();
    fetchSchedule(); 
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: 'ap2' });
    const channel = pusher.subscribe('token-channel');
    channel.bind('token-updated', fetchTokens);
    return () => { pusher.unsubscribe('token-channel'); pusher.disconnect(); };
  }, [fetchTokens]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#f0f4f1] space-y-4">
      <div className="w-12 h-12 border-4 border-[#1a472a]/20 border-t-[#1a472a] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#f0f4f1] text-slate-700 pb-10 overflow-x-hidden ${isUrdu ? 'font-urdu' : ''}`} dir={isUrdu ? "rtl" : "ltr"}>
      
      {/* Navigation Bar */}
      <nav className="p-3 md:p-6 max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-md border border-white rounded-2xl md:rounded-[2rem] p-3 md:p-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2 md:gap-4 px-2">
              <img src="/favicon.ico" alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
              <div>
                  <h1 className="text-[10px] md:text-sm font-black uppercase text-[#1a472a]">
                    {isUrdu ? "ٹوکن سسٹم" : "Token System"}
                  </h1>
                  <p className="text-[7px] text-[#d4af37] font-bold uppercase">
                     {adminRole}
                  </p>
              </div>
          </div>
          <div className="flex gap-2">
            {adminRole === 'superadmin' && (
              <button onClick={() => router.push('/admin/manage')} className="bg-white border border-gray-100 p-2 px-3 rounded-xl text-[8px] md:text-[9px] font-black text-[#1a472a] shadow-sm uppercase">TEAM</button>
            )}
            <button onClick={handleLogout} className="bg-red-50 text-red-500 border border-red-100 px-3 md:px-6 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase">LOGOUT</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border-t-4 border-[#1a472a]">
                 <p className="text-[9px] md:text-[10px] font-black text-[#1a472a]/40 uppercase mb-2">{isUrdu ? "موجودہ ٹوکنز" : "Live Queue"}</p>
                 <h2 className="text-5xl md:text-7xl font-black text-[#1a472a] flex items-baseline gap-2">
                   {tokens.length}
                   <span className="text-[10px] md:text-xs text-gray-400 font-normal uppercase">{isUrdu ? "انتظار" : "waiting"}</span>
                 </h2>
                 <div className="flex gap-2 mt-6">
                    <button onClick={() => setActiveTab('active')} className={`flex-1 py-3 rounded-xl text-[8px] font-black border transition-all ${activeTab === 'active' ? 'bg-[#1a472a] text-white' : 'bg-transparent text-gray-400 border-gray-100'}`}>LIVE</button>
                    {adminRole !== 'staff' && (
                      <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 rounded-xl text-[8px] font-black border transition-all ${activeTab === 'history' ? 'bg-[#1a472a] text-white' : 'bg-transparent text-gray-400 border-gray-100'}`}>HISTORY</button>
                    )}
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  {adminRole !== 'staff' ? (
                    <>
                      <button onClick={() => setReportPreview(true)} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-between px-6 py-4 border border-white shadow-md">
                          <div className={isUrdu ? "text-right" : "text-left"}>
                            <p className="text-[10px] md:text-xs font-black uppercase text-[#1a472a]">{isUrdu ? "رپورٹ" : "Report"}</p>
                            <p className="text-[7px] text-gray-300 font-bold uppercase">Excel Ready</p>
                          </div>
                          <span className="text-xl">📈</span>
                      </button>
                      {adminRole === 'superadmin' && (
                        <button onClick={() => setShowSettings(true)} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-between px-6 py-4 border border-white shadow-md">
                            <div className={isUrdu ? "text-right" : "text-left"}>
                              <p className="text-[10px] md:text-xs font-black uppercase text-[#1a472a]">{isUrdu ? "شیڈول" : "Schedule"}</p>
                              <p className="text-[7px] text-gray-300 font-bold uppercase">Settings</p>
                            </div>
                            <span className="text-xl">🕒</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="bg-[#1a472a] rounded-[2rem] p-6 flex items-center justify-center shadow-lg">
                       <p className="text-white text-[9px] font-black uppercase tracking-widest text-center">Staff Portal Active</p>
                    </div>
                  )}
              </div>
          </div>

          {adminRole !== 'staff' && (
            <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-white h-64 md:h-80 relative overflow-hidden">
                <div className={`absolute top-4 md:top-8 ${isUrdu ? 'right-6 md:right-8 text-right' : 'left-6 md:left-8 text-left'}`}>
                  <h3 className="text-[9px] md:text-[10px] font-black uppercase text-[#d4af37]">Visitor Traffic</h3>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={analytics} margin={{ top: 50, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a472a" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1a472a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000005" />
                    <XAxis dataKey="name" stroke="#ccc" fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{borderRadius: '15px', border: 'none', fontSize: '9px'}} />
                    <Area type="monotone" dataKey="count" stroke="#1a472a" strokeWidth={3} fill="url(#colorGreen)" />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 bg-white rounded-[2rem] md:rounded-[3rem] p-4 md:p-6 shadow-xl border border-white flex flex-col h-[500px] lg:h-[650px] mb-10">
           <div className="mb-6 flex justify-between items-center px-2">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-[#1a472a]">
               {activeTab === 'active' ? "Live Traffic" : "Records"}
             </h3>
             <span className="bg-gray-100 text-[8px] font-black px-3 py-1 rounded-full text-gray-400">
               {activeTab === 'active' ? tokens.length : historyTokens.length} ENTRIES
             </span>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {(activeTab === 'active' ? tokens : historyTokens).map(t => (
                <div key={t._id} className={`p-4 rounded-2xl border transition-all ${t.status === 'calling' ? 'bg-[#1a472a] shadow-lg' : 'bg-[#fcfdfc] border-gray-100'}`}>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[10px] ${t.status === 'calling' ? 'bg-[#d4af37] text-[#1a472a]' : 'bg-white shadow-sm text-[#1a472a]'}`}>
                           {t.tokenNumber}
                         </div>
                         <div onClick={() => setSelectedToken(t)} className="cursor-pointer max-w-[100px] md:max-w-[120px]">
                            <p className={`text-[10px] font-black uppercase truncate ${t.status === 'calling' ? 'text-white' : 'text-[#1a472a]'}`}>{t.name}</p>
                            <p className={`text-[8px] font-bold ${t.status === 'calling' ? 'text-[#d4af37]/80' : 'text-gray-400'}`}>{new Date(t.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                         </div>
                      </div>
                      <div className="flex gap-1">
                         {t.status !== 'completed' && t.status !== 'cancelled' && (
                           <>
                             <button onClick={() => handleVoiceCall(t)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${t.status === 'calling' ? 'bg-white/10 text-white' : 'bg-gray-100 text-[#1a472a]'}`}>📣</button>
                             <button onClick={() => updateStatus(t._id, 'completed')} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${t.status === 'calling' ? 'bg-[#d4af37] text-[#1a472a]' : 'bg-green-50 text-green-600'}`}>✓</button>
                           </>
                         )}
                         {activeTab === 'history' && (
                           <span className={`text-[7px] font-black px-2 py-1 rounded-lg uppercase ${t.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                             {t.status}
                           </span>
                         )}
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </main>

      {/* SCHEDULE & LOCATION MODAL */}
      {showSettings && adminRole === 'superadmin' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className={`bg-white w-full max-w-md rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative border border-white ${isUrdu ? 'text-right' : 'text-left'}`}>
              <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors">✕</button>
              <h3 className="text-xl md:text-2xl font-black mb-6 uppercase text-[#1a472a] italic tracking-tighter">Operational Guard</h3>
              
              <div className="space-y-6">
                 {/* ON/OFF TOGGLE SWITCH */}
                 <div className="flex items-center justify-between bg-[#f8faf9] p-4 rounded-2xl border border-emerald-50">
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#1a472a]">{isUrdu ? "لوکیشن کی پابندی" : "Location Guard"}</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">{isLocationEnabled ? (isUrdu ? "آن ہے" : "ACTIVE") : (isUrdu ? "بند ہے" : "DISABLED")}</p>
                    </div>
                    <button 
                      onClick={() => setIsLocationEnabled(!isLocationEnabled)}
                      className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${isLocationEnabled ? 'bg-[#1a472a]' : 'bg-gray-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isLocationEnabled ? (isUrdu ? '-translate-x-6' : 'translate-x-6') : 'translate-x-0'}`} />
                    </button>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-gray-400">System Days</label>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                       {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                         <button key={day} onClick={() => setActiveDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} 
                            className={`px-3 py-2 rounded-lg text-[8px] md:text-[9px] font-black transition-all ${activeDays.includes(day) ? 'bg-[#1a472a] text-[#d4af37]' : 'bg-gray-100 text-gray-300'}`}>
                            {day}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[8px] font-black uppercase text-gray-400">Start Time</label>
                       <input type="time" value={openTime} onChange={(e)=>setOpenTime(e.target.value)} className="w-full bg-[#f8faf9] p-3 rounded-xl font-black text-xs text-[#1a472a] outline-none border border-gray-100" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[8px] font-black uppercase text-gray-400">End Time</label>
                       <input type="time" value={closeTime} onChange={(e)=>setCloseTime(e.target.value)} className="w-full bg-[#f8faf9] p-3 rounded-xl font-black text-xs text-[#1a472a] outline-none border border-gray-100" />
                    </div>
                 </div>

                 {/* LOCATION SETTINGS SECTION (Sirf tab dikhega jab ON ho) */}
                 <div className={`space-y-4 pt-4 border-t border-gray-100 transition-opacity duration-300 ${isLocationEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="flex justify-between items-center">
                       <label className="text-[10px] font-black uppercase text-[#1a472a]">📍 Radius Parameters</label>
                       <button 
                         onClick={handleGetCurrentLocation}
                         disabled={isDetecting || !isLocationEnabled}
                         className="text-[8px] bg-[#d4af37] text-[#1a472a] px-2 py-1.5 rounded-lg font-bold shadow-sm hover:scale-95 transition-all disabled:opacity-50"
                       >
                         {isDetecting ? (isUrdu ? "ڈیٹیکٹ ہو رہا ہے..." : "DETECTING...") : (isUrdu ? "میری موجودہ لوکیشن" : "USE MY CURRENT GPS")}
                       </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                       <div className="space-y-1">
                          <label className="text-[7px] font-bold text-gray-400">LATITUDE</label>
                          <input 
                            type="number" 
                            step="any"
                            value={officeLat} 
                            onChange={(e) => setOfficeLat(e.target.value)}
                            className="w-full bg-[#f8faf9] p-2 rounded-lg font-black text-[10px] outline-none border border-emerald-100 text-[#1a472a]" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[7px] font-bold text-gray-400">LONGITUDE</label>
                          <input 
                            type="number" 
                            step="any"
                            value={officeLng} 
                            onChange={(e) => setOfficeLng(e.target.value)}
                            className="w-full bg-[#f8faf9] p-2 rounded-lg font-black text-[10px] outline-none border border-emerald-100 text-[#1a472a]" 
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[7px] font-bold text-gray-400">RADIUS (M)</label>
                          <input 
                            type="number" 
                            value={radius} 
                            onChange={(e)=>setRadius(e.target.value)} 
                            className="w-full bg-[#f8faf9] p-2 rounded-lg font-black text-[10px] outline-none border border-gray-100" 
                          />
                       </div>
                    </div>
                 </div>

                 <button onClick={saveSchedule} className="w-full bg-[#1a472a] text-[#d4af37] py-4 rounded-2xl font-black text-[10px] uppercase shadow-xl mt-4 active:scale-95 transition-transform">
                    Save Parameters
                 </button>
              </div>
          </div>
        </div>
      )}

      {reportPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 bg-black/40 backdrop-blur-sm">
           <div className="bg-white w-full max-w-5xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl flex flex-col h-[85vh] border border-white">
              <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-[#1a472a] uppercase">{isUrdu ? "سسٹم رپورٹ" : "System Intelligence"}</h2>
                    <p className="text-[8px] md:text-[10px] text-[#d4af37] font-bold uppercase">Total: {allTokensRaw.length}</p>
                  </div>
                  <button onClick={() => setReportPreview(false)} className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">✕</button>
              </div>
              <div className="flex-1 overflow-auto bg-[#f8faf9] rounded-2xl p-2 md:p-4 border border-gray-100 shadow-inner">
                 <table className={`w-full text-left text-[8px] md:text-[9px] font-bold uppercase border-separate border-spacing-y-2 ${isUrdu ? 'text-right' : 'text-left'}`}>
                    <thead className="sticky top-0 bg-[#f8faf9] text-[#1a472a] z-10">
                        <tr>
                            <th className="p-3 md:p-4 bg-white rounded-l-xl shadow-sm">{isUrdu ? "ٹوکن" : "Token"}</th>
                            <th className="p-3 md:p-4 bg-white shadow-sm">{isUrdu ? "نام" : "Name"}</th>
                            <th className="p-3 md:p-4 bg-white shadow-sm hidden sm:table-cell">{isUrdu ? "فون" : "Phone"}</th>
                            <th className="p-3 md:p-4 bg-white rounded-r-xl shadow-sm text-center">{isUrdu ? "اسٹیٹس" : "Status"}</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-500">
                       {allTokensRaw.map(t => (
                         <tr key={t._id} className="bg-white/50">
                           <td className="p-3 md:p-4 font-black text-[#1a472a]">#{t.tokenNumber}</td>
                           <td className="p-3 md:p-4 text-black">{t.name}</td>
                           <td className="p-3 md:p-4 hidden sm:table-cell">{t.phone}</td>
                           <td className="p-3 md:p-4 text-center">
                             <span className={`px-2 py-0.5 rounded-full text-[7px] ${t.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <button onClick={downloadExcel} className="w-full mt-6 bg-[#1a472a] text-[#d4af37] py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg">Download Master Excel</button>
           </div>
        </div>
      )}

      {selectedToken && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm">
           <div className={`bg-white w-full max-w-md rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 shadow-2xl border border-white ${isUrdu ? 'text-right' : 'text-left'}`}>
              <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f8faf9] rounded-2xl md:rounded-[2rem] flex items-center justify-center text-2xl font-black text-[#1a472a] shadow-inner mx-auto mb-6 border border-gray-100">
                  {selectedToken.tokenNumber}
              </div>
              <div className="space-y-3">
                 <div className="bg-[#f8faf9] p-4 rounded-2xl">
                    <span className="text-[7px] font-black text-[#d4af37] uppercase">{isUrdu ? "نام" : "Name"}</span>
                    <p className="text-xs md:text-sm font-black text-[#1a472a] uppercase">{selectedToken.name}</p>
                 </div>
                 <div className="bg-[#f8faf9] p-4 rounded-2xl">
                    <span className="text-[7px] font-black text-[#d4af37] uppercase">{isUrdu ? "رابطہ" : "Contact"}</span>
                    <p className="text-[10px] md:text-xs font-bold text-[#1a472a]">{selectedToken.phone}</p>
                 </div>
                 <div className="bg-[#f8faf9] p-4 rounded-2xl">
                    <span className="text-[7px] font-black text-[#d4af37] uppercase">{isUrdu ? "مسئلہ" : "Issue"}</span>
                    <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase italic">{selectedToken.issue}</p>
                 </div>
              </div>
              <button onClick={() => setSelectedToken(null)} className="w-full mt-8 py-4 bg-[#1a472a] text-[#d4af37] rounded-2xl font-black uppercase text-[10px]">Close Profile</button>
           </div>
        </div>
      )}
    </div>
  );
}