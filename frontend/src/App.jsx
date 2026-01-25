import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { io } from 'socket.io-client';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import './i18n';
import PublicDashboard from './components/PublicDashboard';

const SOCKET_URL = window.location.hostname === 'localhost'
  ? "http://localhost:5000"
  : window.location.origin;

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket']
});

const formatTime12 = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(':');
  const hr = parseInt(h);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const h12 = hr % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const ManualTimeInput = ({ value, onChange, label }) => (
  <div className="flex flex-col gap-1 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm w-full">
    <span className="text-[10px] font-black text-emerald-600 uppercase mb-1">{label}</span>
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-emerald-50 text-sm font-bold p-2 rounded-lg outline-none border-2 border-transparent focus:border-emerald-500 w-full"
    />
  </div>
);

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center bg-emerald-50 sticky top-0 z-10">
          <h3 className="font-black text-emerald-800 uppercase text-sm">{title}</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-md text-2xl font-bold text-emerald-600">&times;</button>
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
};

const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[999] bg-emerald-700 flex flex-col items-center justify-center text-white p-6 text-center">
      <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-2xl animate-bounce text-emerald-700 text-4xl font-black">T</div>
      <h1 className="text-2xl font-black tracking-widest uppercase mb-2">Token System</h1>
      <p className="font-urdu text-lg opacity-90">روحانی خدمات میں خوش آمدید</p>
    </div>
  );
};

const Nav = ({ toggleLang, t, isAuth, logout, isUrdu, userRole }) => {
  const location = useLocation();
  if (location.pathname === '/waiting') return null;

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b p-2 md:p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-2">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black shrink-0">T</div>
          <span className="font-black text-emerald-800 text-[12px] md:text-lg tracking-tight truncate max-w-[120px] md:max-w-none">{t('title')}</span>
        </Link>
        <div className="flex items-center gap-1 md:gap-4">
          {userRole === 'superadmin' && <span className="bg-purple-100 text-purple-700 text-[8px] px-2 py-1 rounded font-black hidden md:block">SUPER ADMIN</span>}
          <Link to="/waiting" className="text-[10px] md:text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-2 rounded-lg border border-emerald-100">📺 TV</Link>
          {isAuth ? (
            <div className="flex gap-1 md:gap-2">
              <Link to="/admin" className="text-[10px] md:text-xs font-black text-blue-600 bg-blue-50 px-2 py-2 rounded-lg border border-blue-100">⚙️ Admin</Link>
              <button onClick={logout} className="text-[10px] md:text-xs font-black text-red-500 bg-red-50 px-2 py-2 rounded-lg border border-red-100">🚪</button>
            </div>
          ) : (
            <Link to="/admin" className="text-[10px] md:text-xs font-black text-gray-400 uppercase px-1">Login</Link>
          )}
          <button onClick={toggleLang} className="bg-emerald-600 text-white px-3 md:px-6 py-2 rounded-full text-[10px] md:text-sm font-black shadow-md">
            {isUrdu ? 'EN' : 'اردو'}
          </button>
        </div>
      </div>
    </nav>
  );
};

// --- USER PAGE ---
const UserPage = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({ name: '', phone: '', residence: '', issue: '' });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [tokenResult, setTokenResult] = useState(null);
  const [schedule, setSchedule] = useState({});
  const tokenRef = useRef(null);
  const isUrdu = i18n.language === 'ur';

  const loadSchedule = useCallback(async () => {
    try {
      const res = await axios.get(`${SOCKET_URL}/api/schedule`);
      if (res.data.data) setSchedule(res.data.data);
    } catch (err) {
      console.error("Schedule Load Error", err.message);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
    socket.on('schedule-updated', (newSchedule) => { setSchedule(newSchedule); });
    return () => socket.off('schedule-updated');
  }, [loadSchedule]);

  const isTimeAllowed = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const today = days[now.getDay()];
    const config = schedule[today];
    if (!config || !config.isOpen) return false;
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    return currentTime >= config.start && currentTime <= config.end;
  }, [schedule]);

  const downloadTokenImage = (tokenNum) => {
    const element = tokenRef.current;
    if (element) {
      html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false
      }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Token-${tokenNum}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isTimeAllowed) return;
    setLoading(true);
    try {
      const res = await axios.post(`${SOCKET_URL}/api/tokens/generate`, formData);
      if (res.data.success) {
        setTokenResult(res.data.data);
        setFormData({ name: '', phone: '', residence: '', issue: '' });
        socket.emit('new-token-alert', res.data.data);
        setTimeout(() => downloadTokenImage(res.data.data.tokenNumber), 1000);
      }
    } catch (err) {
      alert("Error!");
      console.error(err);
    }
    setLoading(false);
  };

  if (dataLoading) return <div className="flex justify-center py-20"><div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (tokenResult) return (
    <div className="max-w-md mx-auto p-4 md:pt-10">
      <div ref={tokenRef} style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '40px', border: '10px solid #10b981', textAlign: 'center' }}>
        <p style={{ color: '#9ca3af', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px' }}> {isUrdu ? 'آپ کا ٹوکن نمبر' : 'YOUR TOKEN NUMBER'} </p>
        <h1 style={{ color: '#059669', fontSize: '80px', fontWeight: '900', margin: '0' }}> #{tokenResult.tokenNumber} </h1>
        <p style={{ color: '#1e293b', fontSize: '24px', fontWeight: '900', marginTop: '24px' }}> {tokenResult.name} </p>
        <div style={{ backgroundColor: '#ecfdf5', padding: '16px', borderRadius: '16px', border: '2px solid #d1fae5', marginTop: '24px' }}>
          <p style={{ color: '#047857', fontWeight: '900', fontSize: '20px', margin: '0' }}> {isUrdu ? "فیس: 200 روپے" : "FEES: RS. 200"} </p>
        </div>
      </div>
      <div className="space-y-3 mt-8">
        <button onClick={() => downloadTokenImage(tokenResult.tokenNumber)} className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-lg">📸 {isUrdu ? 'دوبارہ محفوظ کریں' : 'SAVE AGAIN'}</button>
        <button onClick={() => setTokenResult(null)} className="w-full py-4 bg-gray-100 rounded-[1.5rem] text-gray-500 font-black text-lg">{isUrdu ? 'نیا ٹوکن' : 'GET ANOTHER'}</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto p-3 md:p-6" dir={isUrdu ? "rtl" : "ltr"}>
      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border">
        <div className={`p-6 md:p-10 text-white text-center transition-all ${isTimeAllowed ? 'bg-emerald-600' : 'bg-red-500'}`}>
          <h2 className="text-2xl md:text-4xl font-black mb-2">{isTimeAllowed ? (isUrdu ? 'خوش آمدید' : 'Welcome') : (isUrdu ? 'ٹوکن بند ہیں' : 'TOKENS CLOSED')}</h2>
          <p className="opacity-90 font-bold text-[10px] tracking-widest uppercase">{isTimeAllowed ? (isUrdu ? 'تفصیلات درج کریں' : 'Enter Details') : (isUrdu ? 'اوقات کار چیک کریں' : 'Check Schedule')}</p>
        </div>
        {isTimeAllowed ? (
          <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-4 md:space-y-6">
            <div>
              <label className="block text-[10px] font-black text-emerald-600 uppercase mb-1">{t('name_label')}</label>
              <input type="text" required className="w-full p-4 pb-5 text-lg rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-emerald-600 uppercase mb-1">{t('phone_label')}</label>
              <input type="tel" required className="w-full p-4 pb-5 text-lg rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-emerald-600 uppercase mb-1">{t('residence_label')}</label>
              <input type="text" required className="w-full p-4 pb-5 text-lg rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold" value={formData.residence} onChange={e => setFormData({ ...formData, residence: e.target.value })} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-emerald-600 uppercase mb-1">{t('issue_label')}</label>
              <textarea required rows="2" className="w-full p-4 pb-5 text-lg rounded-2xl bg-gray-50 border-2 border-transparent focus:border-emerald-500 outline-none font-bold resize-none" value={formData.issue} onChange={e => setFormData({ ...formData, issue: e.target.value })} />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-xl shadow-lg active:scale-95">{loading ? "..." : (isUrdu ? 'ٹوکن حاصل کریں' : 'GET TOKEN')}</button>
          </form>
        ) : (
          <div className="p-8 text-center">
            <div className="bg-gray-50 rounded-3xl p-6 border-2 border-dashed">
              <h4 className="font-black text-gray-700 mb-4 uppercase">{isUrdu ? 'آج کے اوقات' : 'Today\'s Schedule'}</h4>
              <p className="text-red-500 font-black mb-4">{isUrdu ? 'اس وقت ٹوکن دستیاب نہیں ہیں۔' : 'Tokens are closed now.'}</p>
              <div className="text-xs space-y-2 opacity-60">
                {Object.keys(schedule).map(day => (
                  <div key={day} className="flex justify-between border-b pb-1">
                    <span className="font-bold">{day}</span>
                    <span className="font-bold">{schedule[day].isOpen ? `${formatTime12(schedule[day].start)} - ${formatTime12(schedule[day].end)}` : 'OFF'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- ADMIN PAGE ---
const AdminPage = () => {
  const { i18n } = useTranslation();
  const [tokens, setTokens] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMureed, setSelectedMureed] = useState(null);
  const [activeDevices, setActiveDevices] = useState([]);
  const isUrdu = i18n.language === 'ur';
  const userRole = localStorage.getItem('userRole');

  const [advancedSchedule, setAdvancedSchedule] = useState({
    Mon: { start: '09:00', end: '21:00', isOpen: true },
    Tue: { start: '09:00', end: '21:00', isOpen: true },
    Wed: { start: '09:00', end: '21:00', isOpen: true },
    Thu: { start: '09:00', end: '21:00', isOpen: true },
    Fri: { start: '09:00', end: '21:00', isOpen: true },
    Sat: { start: '09:00', end: '21:00', isOpen: true },
    Sun: { start: '09:00', end: '21:00', isOpen: false },
  });

  const fetchTokens = useCallback(async () => {
    try {
      const res = await axios.get(`${SOCKET_URL}/api/tokens/all`);
      setTokens(res.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) { console.error(err); }
  }, []);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await axios.get(`${SOCKET_URL}/api/schedule`);
      if (res.data.data) setAdvancedSchedule(res.data.data);
    } catch (err) {
      console.error("Schedule Fetch Error", err.message);
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchTokens();
      await fetchSchedule();
    };

    initializeDashboard();
    socket.on("new-token", (newToken) => { setTokens(prev => [newToken, ...prev]); });
    socket.on("active-users-update", (users) => { setActiveDevices(users); });
    socket.on("list-updated", fetchTokens);
    return () => {
      socket.off("new-token");
      socket.off("active-users-update");
      socket.off("list-updated");
    };
  }, [fetchTokens, fetchSchedule]);

  const handleCallMureed = (tk) => {
    socket.emit('call-token-ui', { tokenNumber: tk.tokenNumber, name: tk.name });
  };

  const deleteToken = async (id) => {
    if (!window.confirm("Khatam kar dein?")) return;
    try {
      await axios.delete(`${SOCKET_URL}/api/tokens/${id}`);
      fetchTokens();
    } catch (err) {
      alert("Error deleting");
      console.error(err);
    }
  }

  const saveScheduleToDB = async () => {
    try {
      await axios.post(`${SOCKET_URL}/api/schedule/update`, { schedule: advancedSchedule });
      socket.emit('admin-updated-schedule', advancedSchedule);
      alert(isUrdu ? "محفوظ ہو گیا!" : "Saved!");
      setShowSettings(false);
    } catch (err) {
      alert("Error deleting");
      console.error(err);
    }
  };

  const updateDay = (day, field, value) => {
    setAdvancedSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const stats = useMemo(() => ({
    total: tokens.length,
    pending: tokens.filter(tk => tk.status === 'pending').length,
    income: tokens.length * 200
  }), [tokens]);

  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tokens.map(tk => ({ Token: tk.tokenNumber, Name: tk.name, Status: tk.status, Date: new Date(tk.createdAt).toLocaleString() })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tokens");
    XLSX.writeFile(wb, `Report-${new Date().toLocaleDateString()}.xlsx`);
  };

  const filtered = tokens.filter(tk => tk.name.toLowerCase().includes(searchTerm.toLowerCase()) || tk.tokenNumber.toString().includes(searchTerm));

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-8" dir={isUrdu ? "rtl" : "ltr"}>

      {userRole === 'superadmin' && (
        <div className="mb-8 p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl border-b-4 border-indigo-500">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="flex h-3 w-3 relative"><span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative rounded-full h-3 w-3 bg-red-500"></span></span>
            LIVE DEVICES ({activeDevices.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeDevices.map((u, i) => (
              <div key={i} className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-[10px]">
                <p className="text-indigo-400 font-mono truncate">{u.id}</p>
                <p className="text-gray-400 truncate">{u.device}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-2xl font-black text-slate-800 uppercase italic">{isUrdu ? 'ایڈمن پینل' : 'ADMIN PANEL'}</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setShowSettings(!showSettings)} className="flex-1 md:flex-none bg-emerald-100 text-emerald-700 px-6 py-3 rounded-xl font-bold">⚙️ {isUrdu ? 'سیٹنگز' : 'Settings'}</button>
          <button onClick={downloadExcel} className="flex-1 md:flex-none bg-slate-800 text-white px-6 py-3 rounded-xl font-bold uppercase text-[10px]">📊 {isUrdu ? 'رپورٹس' : 'REPORTS'} </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-white p-4 md:p-8 rounded-[2rem] border-4 border-emerald-500 mb-8 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(advancedSchedule).map(day => (
              <div key={day} className="p-4 bg-gray-50 rounded-2xl border flex flex-col gap-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-black text-emerald-700">{day}</span>
                  <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={advancedSchedule[day].isOpen} onChange={e => updateDay(day, 'isOpen', e.target.checked)} />
                </div>
                <div className="space-y-2">
                  <ManualTimeInput label="START" value={advancedSchedule[day].start} onChange={v => updateDay(day, 'start', v)} />
                  <ManualTimeInput label="END" value={advancedSchedule[day].end} onChange={v => updateDay(day, 'end', v)} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={saveScheduleToDB} className="mt-6 bg-emerald-600 text-white w-full py-4 rounded-xl font-black shadow-lg">SAVE CHANGES</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-600 text-white p-5 rounded-3xl flex justify-between items-center shadow-lg">
          <div><p className="text-[10px] font-black opacity-80 uppercase">{isUrdu ? 'کُل' : 'TOTAL'}</p><p className="text-3xl font-black">{stats.total}</p></div>
          <div className="text-3xl opacity-30">👥</div>
        </div>
        <div className="bg-amber-500 text-white p-5 rounded-3xl flex justify-between items-center shadow-lg">
          <div><p className="text-[10px] font-black opacity-80 uppercase">{isUrdu ? 'انتظار' : 'WAITING'}</p><p className="text-3xl font-black">{stats.pending}</p></div>
          <div className="text-3xl opacity-30">⏳</div>
        </div>
        <div className="bg-blue-600 text-white p-5 rounded-3xl flex justify-between items-center shadow-lg">
          <div><p className="text-[10px] font-black opacity-80 uppercase">{isUrdu ? 'آمدنی' : 'INCOME'}</p><p className="text-3xl font-black">Rs.{stats.income}</p></div>
          <div className="text-3xl opacity-30">💰</div>
        </div>
      </div>

      <input type="text" placeholder={isUrdu ? "تلاش کریں..." : "Search..."} className="w-full p-4 rounded-2xl border-4 border-emerald-50 mb-6 font-bold outline-none focus:border-emerald-200" onChange={e => setSearchTerm(e.target.value)} />

      <div className="grid gap-3">
        {filtered.map(tk => (
          <div key={tk._id} className={`bg-white p-4 rounded-[1.5rem] shadow-sm border-2 flex flex-col md:flex-row justify-between items-center gap-4 ${tk.status === 'completed' ? 'opacity-50' : 'hover:border-emerald-300'}`}>
            <div className="flex items-center gap-4 w-full cursor-pointer" onClick={() => setSelectedMureed(tk)}>
              <span className="text-3xl font-black text-emerald-600 shrink-0">#{tk.tokenNumber}</span>
              <div className="truncate text-left w-full pb-2">
                <p className="text-lg font-black text-slate-800 truncate">{tk.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase">{tk.residence} | {tk.phone}</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              {tk.status === 'pending' ? (
                <>
                  <button onClick={() => axios.patch(`${SOCKET_URL}/api/tokens/status/${tk._id}`, { status: 'completed' }).then(fetchTokens)} className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-xl font-black text-[10px]">DONE</button>
                  <button onClick={() => handleCallMureed(tk)} className="flex-1 bg-amber-500 text-white px-4 py-3 rounded-xl font-black text-[10px] animate-pulse">CALL</button>
                  {userRole === 'superadmin' && <button onClick={() => deleteToken(tk._id)} className="flex-1 bg-red-600 text-white px-4 py-3 rounded-xl font-black text-[10px]">DEL</button>}
                </>
              ) : (
                <div className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase w-full text-center italic">Finished</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!selectedMureed} onClose={() => setSelectedMureed(null)} title="Details">
        {selectedMureed && (
          <div className="space-y-4" dir={isUrdu ? "rtl" : "ltr"}>
            <div className="text-center pb-4 border-b">
              <span className="text-5xl font-black text-emerald-600 block italic">#{selectedMureed.tokenNumber}</span>
              <h2 className="text-2xl font-black text-slate-800 pb-2">{selectedMureed.name}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-gray-50 p-3 rounded-xl text-left"><label className="font-black text-gray-400">PHONE</label><p className="font-bold">{selectedMureed.phone}</p></div>
              <div className="bg-gray-50 p-3 rounded-xl text-left"><label className="font-black text-gray-400">RESIDENCE</label><p className="font-bold">{selectedMureed.residence}</p></div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-100 pb-6">
              <label className="text-[10px] font-black text-emerald-600 block mb-1">ISSUE</label>
              <p className="font-bold text-emerald-900 leading-snug">{selectedMureed.issue}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// --- APP MAIN ---
function App() {
  const { i18n, t } = useTranslation();

  // 1. Initialize state DIRECTLY from localStorage to avoid the "cascading render" error
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('adminToken'));
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || "");

  const [username, setUsername] = useState("");
  const [pass, setPass] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const isUrdu = i18n.language === 'ur';

  // 2. This effect now only handles side-effects (Socket/Axios), not state initialization
  useEffect(() => {
    socket.connect();

    const token = localStorage.getItem('adminToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    return () => { socket.disconnect(); };
  }, []);

  // 3. Keep your UI direction logic
  useEffect(() => {
    document.body.dir = isUrdu ? 'rtl' : 'ltr';
    document.body.className = `bg-slate-50 ${isUrdu ? 'font-urdu' : 'antialiased'}`;
  }, [isUrdu]);

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${SOCKET_URL}/api/admin/login`, { username, password: pass });
      if (res.data.success) {
        const { token, role } = res.data;
        localStorage.setItem('adminToken', token);
        localStorage.setItem('userRole', role);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Update states
        setIsAuth(true);
        setUserRole(role);
        setPass("");
      }
    } catch (err) { alert("Wrong credentials!"); console.error(err); }
  };

  const handleLogout = (navFunc) => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuth(false);
    setUserRole("");
    navFunc('/');
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;

  return (
    <Router>
      <AppContent
        isUrdu={isUrdu} t={t} i18n={i18n}
        isAuth={isAuth} userRole={userRole}
        handleLogout={handleLogout} handleLogin={handleLogin}
        pass={pass} setPass={setPass}
        username={username} setUsername={setUsername}
      />
    </Router>
  );
}

function AppContent({ isUrdu, t, i18n, isAuth, userRole, handleLogout, handleLogin, pass, setPass, username, setUsername }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden">
      <Nav toggleLang={() => i18n.changeLanguage(isUrdu ? 'en' : 'ur')} t={t} isAuth={isAuth} userRole={userRole} logout={() => handleLogout(navigate)} isUrdu={isUrdu} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<UserPage />} />
          <Route path="/waiting" element={<PublicDashboard />} />
          <Route path="/admin" element={!isAuth ? (
            <div className="flex items-center justify-center p-4 min-h-[70vh]">
              <div className="max-w-md w-full p-8 bg-white rounded-[2.5rem] shadow-2xl text-center border-t-8 border-emerald-600">
                <h2 className="text-2xl font-black mb-6 text-slate-800 uppercase tracking-widest italic">Admin Login</h2>

                <input
                  type="text"
                  placeholder="Username"
                  className="w-full p-4 border rounded-2xl mb-3 font-bold outline-none focus:border-emerald-500 bg-gray-50"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="••••"
                  className="w-full p-4 text-center text-3xl border rounded-2xl mb-6 font-black tracking-[0.5rem] outline-none focus:border-emerald-500 bg-gray-50"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                />

                <button onClick={handleLogin} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 uppercase">Access System</button>
              </div>
            </div>
          ) : <AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;