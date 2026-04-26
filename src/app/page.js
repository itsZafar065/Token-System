"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
const domtoimage = typeof window !== 'undefined' ? require('dom-to-image-more') : null;

export default function Home() {
  const { isUrdu } = useApp();
  const [tokenGenerated, setTokenGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isSystemOpen, setIsSystemOpen] = useState(false); 
  const [scheduleData, setScheduleData] = useState({ openTime: "--:--", closeTime: "--:--" });
  const tokenRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', phone: '', residence: '', issue: '' });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/schedule', { method: 'PATCH', cache: 'no-store' });
        const result = await res.json();
        if (result.success && result.data) {
          const s = result.data;
          setScheduleData({ openTime: s.openTime, closeTime: s.closeTime });
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit' });
          const parts = formatter.formatToParts(now);
          const currentDay = parts.find(p => p.type === 'weekday').value;
          const currentH = parseInt(parts.find(p => p.type === 'hour').value);
          const currentM = parseInt(parts.find(p => p.type === 'minute').value);
          const currentTime = (currentH * 60) + currentM;
          const [sH, sM] = s.openTime.split(':').map(Number);
          const [eH, eM] = s.closeTime.split(':').map(Number);
          setIsSystemOpen(s.activeDays?.includes(currentDay) && currentTime >= (sH * 60 + sM) && currentTime <= (eH * 60 + eM));
        }
      } catch (err) { console.error(err); } finally { setIsAppLoading(false); }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tokenGenerated && tokenRef.current && domtoimage) {
      setTimeout(async () => {
        try {
          const dataUrl = await domtoimage.toPng(tokenRef.current, { quality: 1, bgcolor: '#ffffff' });
          const link = document.createElement('a');
          link.download = `Token-${tokenGenerated}.png`;
          link.href = dataUrl;
          link.click();
        } catch (e) { console.error("Save failed"); }
      }, 1000);
    }
  }, [tokenGenerated]);

  const handleGetToken = async (e) => {
    e.preventDefault();
    if (formData.phone.length !== 11) return alert(isUrdu ? "نمبر غلط ہے" : "Invalid Phone");
    if (!isSystemOpen) return alert(isUrdu ? "سسٹم فی الحال بند ہے" : "System Closed");
    
    setLoading(true);

    if (!navigator.geolocation) {
      alert(isUrdu ? "آپ کا براؤزر لوکیشن کو سپورٹ نہیں کرتا" : "Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/tokens', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ...formData, 
              userLat: pos.coords.latitude, 
              userLng: pos.coords.longitude 
            }), 
          });
          
          const data = await res.json();
          
          if (data.success) {
            setTokenGenerated(data.tokenNumber);
          } else {
            // Restriction Message
            if (data.message.includes("Limit Reached")) {
              alert(isUrdu ? "آپ آج کا ٹوکن پہلے ہی حاصل کر چکے ہیں۔" : "Limit reached. You have already generated a token today.");
            } else {
              alert(data.message || (isUrdu ? "ٹوکن حاصل کرنے میں دشواری" : "Error"));
            }
          }
        } catch (error) { 
          alert(isUrdu ? "نیٹ ورک کا مسئلہ" : "Network Error"); 
        } finally { 
          setLoading(false); 
        }
      }, 
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          alert(isUrdu ? "ٹوکن کے لیے لوکیشن کی اجازت لازمی ہے" : "Location permission is required.");
        } else {
          alert(isUrdu ? "لوکیشن حاصل کرنے میں دشواری" : "Error getting location.");
        }
      }, 
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (isAppLoading) return <div className="min-h-screen flex items-center justify-center bg-emerald-900 text-yellow-500 italic">Loading...</div>;

  return (
    <div className={`min-h-[90vh] flex items-center justify-center p-4 bg-stone-100 ${isUrdu ? 'font-urdu' : 'font-sans'}`}>
      {!tokenGenerated ? (
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className={`${isSystemOpen ? 'bg-emerald-900' : 'bg-slate-700'} p-8 text-center text-yellow-500`}>
            <h2 className="text-2xl font-black">{isSystemOpen ? (isUrdu ? "خوش آمدید" : "WELCOME") : (isUrdu ? "معذرت" : "CLOSED")}</h2>
          </div>
          {!isSystemOpen ? (
            <div className="p-10 text-center">
              <div className="text-7xl mb-4">🌙</div>
              <h3 className="text-gray-800 text-2xl font-black mb-6">{isUrdu ? "رجسٹریشن بند ہے" : "Closed"}</h3>
              <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-[2rem]">
                <div className="flex justify-center items-center gap-6">
                   <div className="text-center">
                     <span className="block text-xs font-bold text-emerald-600">{isUrdu ? "کھلنے کا وقت" : "OPEN"}</span>
                     <span className="text-3xl font-black text-emerald-900">{scheduleData.openTime}</span>
                   </div>
                   <div className="h-10 w-[2px] bg-emerald-200"></div>
                   <div className="text-center">
                     <span className="block text-xs font-bold text-emerald-600">{isUrdu ? "بند ہونے کا وقت" : "CLOSE"}</span>
                     <span className="text-3xl font-black text-emerald-900">{scheduleData.closeTime}</span>
                   </div>
                 </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGetToken} className="p-8 space-y-4">
              <input type="text" required placeholder={isUrdu ? "نام" : "Name"} value={formData.name} onChange={(e)=>setFormData({...formData, name:e.target.value})} className="w-full p-4 rounded-2xl bg-stone-50 outline-none font-bold border border-stone-100" />
              <input type="tel" required maxLength={11} placeholder="03XXXXXXXXX" value={formData.phone} onChange={(e)=>setFormData({...formData, phone:e.target.value.replace(/\D/g,'')})} className="w-full p-4 rounded-2xl bg-stone-50 outline-none font-bold border border-stone-100" />
              <input type="text" required placeholder={isUrdu ? "رہائش" : "Residence"} value={formData.residence} onChange={(e)=>setFormData({...formData, residence:e.target.value})} className="w-full p-4 rounded-2xl bg-stone-50 outline-none font-bold border border-stone-100" />
              <textarea required placeholder={isUrdu ? "مسئلہ" : "Issue"} value={formData.issue} onChange={(e)=>setFormData({...formData, issue:e.target.value})} className="w-full p-4 rounded-2xl bg-stone-50 outline-none font-bold border border-stone-100" rows="2" />
              
              <div className="p-2 text-[10px] text-gray-400 text-center">
                {isUrdu ? "* ٹوکن کے لیے مخصوص حدود میں ہونا لازمی ہے" : "* Must be within office area to get token"}
              </div>

              <button type="submit" disabled={loading} className="w-full bg-emerald-900 text-yellow-500 py-5 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-transform">
                {loading ? "..." : (isUrdu ? "ٹوکن حاصل کریں" : "GET TOKEN")}
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
            <div ref={tokenRef} className="bg-white p-10 rounded-[3rem] shadow-2xl text-center w-80 border-8 border-emerald-900/10">
                <div className="bg-emerald-900 text-yellow-500 py-10 rounded-[2.5rem] my-4 shadow-xl">
                    <span className="text-7xl font-black">#{tokenGenerated}</span>
                </div>
                <p className="text-emerald-900 font-black text-2xl uppercase mt-4">{formData.name}</p>
                <p className="text-gray-400 text-[10px] mt-4">{new Date().toLocaleString()}</p>
            </div>
            <button onClick={() => window.location.reload()} className="mt-8 text-emerald-900 font-black underline hover:text-emerald-700 transition-colors">NEW TOKEN</button>
        </div>
      )}
    </div>
  );
}