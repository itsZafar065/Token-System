import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // Back button ke liye

const SOCKET_URL = "http://localhost:5000";
const socket = io(SOCKET_URL);

const PublicDashboard = () => {
  const [tokens, setTokens] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [lastCalledData, setLastCalledData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t, i18n } = useTranslation();
  const navigate = useNavigate(); // Navigation hook
  const isUrdu = i18n.language === 'ur';

  const bellAudio = useRef(new Audio("https://www.soundjay.com/buttons/sounds/beep-07a.mp3"));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchActiveTokens = useCallback(async () => {
    try {
      const res = await axios.get(`${SOCKET_URL}/api/tokens/all`);
      const pending = res.data.data
        .filter(tk => tk.status === 'pending')
        .sort((a, b) => a.tokenNumber - b.tokenNumber);
      setTokens(pending);
    } catch (err) { console.error(err); }
  }, []);

  // --- 🎤 VOICE ANNOUNCEMENT ---
  const announceToken = (tokenNumber, name) => {
    if (isMuted || !isStarted) return;

    bellAudio.current.currentTime = 0;
    bellAudio.current.play().catch(() => { });

    setTimeout(() => {
      window.speechSynthesis.cancel();
      const text = isUrdu ? `ٹوکن نمبر ${tokenNumber}, ${name}, تشریف لائیں` : `Token Number ${tokenNumber}, ${name}, please come.`;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = isUrdu ? 'ur-PK' : 'en-US';
      utter.rate = 0.8;
      window.speechSynthesis.speak(utter);
    }, 1000);
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await fetchActiveTokens();
      } catch (err) {
        console.error("Initial fetch failed", err);
      }
    };

    initializeDashboard();

    socket.on("token-call", (data) => {
      if (data) {
        // Purana data clear karke foran naya set karna
        setLastCalledData(null);
        setTimeout(() => {
          setLastCalledData(data);
          announceToken(data.tokenNumber, data.name);
          fetchActiveTokens(); // List update karein
        }, 100);

        // 10 second baad highlight khatam karke normal list pe le aana
        setTimeout(() => setLastCalledData(null), 10000);
      }
    });

    return () => socket.off("token-call");
  }, [isMuted, isStarted, isUrdu, fetchActiveTokens]);

  const startSystem = () => {
    setIsStarted(true);
    setIsMuted(false);
    fetchActiveTokens();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(""));
  };

  const currentToken = tokens[0];
  const upcomingTokens = tokens.slice(1, 6);

  return (
    <div className={`fixed inset-0 z-[999] bg-[#020617] text-white flex flex-col p-4 md:p-8 ${isUrdu ? 'font-urdu' : ''}`} dir={isUrdu ? "rtl" : "ltr"}>

      {!isStarted && (
        <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-emerald-600 rounded-full mb-6 animate-pulse flex items-center justify-center text-4xl">🔊</div>
          <h1 className="text-3xl md:text-5xl font-black mb-8 uppercase tracking-tighter">Public Dashboard</h1>
          <button onClick={startSystem} className="bg-emerald-600 hover:bg-emerald-500 text-white px-12 py-6 rounded-full text-3xl font-black shadow-2xl transition-all">
            START TV SCREEN
          </button>
          {/* Back to Home for mobile users */}
          <button onClick={() => navigate('/')} className="mt-8 text-white/40 underline text-lg">Back to Home</button>
        </div>
      )}

      {/* TOP BAR */}
      <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-3xl mb-6">
        <div className="flex items-center gap-3">
          {/* BACK BUTTON ICON (Visible on Mobile) */}
          <button onClick={() => navigate('/')} className="lg:hidden bg-white/10 p-3 rounded-xl mr-2">
            ⬅️
          </button>
          <div className={`h-3 w-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
          <span className="text-sm font-black text-emerald-500 uppercase tracking-widest hidden sm:inline">Live Connection</span>
        </div>
        <div className="text-2xl md:text-5xl font-mono font-black text-white/30 tracking-widest">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 px-4 py-2 rounded-xl text-[10px] md:text-xs font-black uppercase">
            {isMuted ? '🔊 Unmute' : '🔇 Mute'}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        <div className="lg:col-span-8 flex flex-col">
          <div className={`flex-1 rounded-[3rem] p-8 text-center flex flex-col justify-center items-center transition-all duration-700 border-4 shadow-2xl relative overflow-hidden ${lastCalledData ? 'bg-white text-emerald-600 border-white scale-[1.02]' : 'bg-emerald-600 border-emerald-500/30'}`}>

            <h2 className={`text-2xl md:text-5xl font-black uppercase mb-4 tracking-tighter ${lastCalledData ? 'text-black/30 animate-bounce' : 'text-white/30'}`}>
              {lastCalledData ? (isUrdu ? 'ابھی بلایا گیا' : 'CALLING NOW') : t('now_serving')}
            </h2>

            {/* Displaying Token Info */}
            {(lastCalledData || currentToken) ? (
              <div key={lastCalledData ? lastCalledData._id : (currentToken ? currentToken._id : 'none')} className="animate-in zoom-in duration-500 flex flex-col items-center">
                <div className="text-[25vw] lg:text-[18rem] font-black leading-none tracking-tighter drop-shadow-2xl">
                  #{lastCalledData ? lastCalledData.tokenNumber : currentToken.tokenNumber}
                </div>
                <div className={`text-3xl md:text-7xl font-bold px-12 py-4 rounded-3xl border-2 mt-4 ${lastCalledData ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-black/10 border-white/10'}`}>
                  {lastCalledData ? lastCalledData.name : currentToken.name}
                </div>
              </div>
            ) : (
              <div className="text-4xl md:text-8xl font-black opacity-10 uppercase tracking-widest italic animate-pulse">{t('no_pending')}</div>
            )}
          </div>
        </div>

        {/* SIDE LIST */}
        <div className="lg:col-span-4 bg-slate-900/40 rounded-[3rem] p-6 md:p-8 border border-white/5 flex flex-col overflow-hidden">
          <h3 className="text-xl md:text-3xl font-black text-emerald-400 uppercase mb-8 flex justify-between">
            <span>{t('upcoming')}</span>
            <span className="text-xs bg-emerald-500/20 px-3 py-1 rounded-full text-emerald-400">{upcomingTokens.length} Next</span>
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scroll">
            {upcomingTokens.map((tk) => (
              <div key={tk._id} className="bg-white/5 p-4 md:p-8 rounded-[2rem] flex justify-between items-center border border-white/5">
                <div className="flex items-center gap-5">
                  <span className="text-3xl md:text-6xl font-black text-emerald-500">#{tk.tokenNumber}</span>
                  <span className="text-xl md:text-3xl font-bold opacity-80 truncate max-w-[150px]">{tk.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="h-20 md:h-32 bg-emerald-600 text-white mt-6 rounded-[2.5rem] flex items-center overflow-hidden border-t-4 border-emerald-400 shadow-2xl">
        <div className="bg-emerald-900 h-full flex items-center px-6 md:px-12 z-10 font-black italic uppercase text-xs md:text-3xl border-r-2 border-emerald-500">
          {isUrdu ? 'اطلاع' : 'Info'}
        </div>
        <div className="animate-marquee whitespace-nowrap text-2xl md:text-6xl font-black flex items-center gap-10 md:gap-32 pl-20 uppercase">
          <span>{t('durood')}</span>
          <span className="opacity-40">•</span>
          <span>براہ کرم اپنی باری کا انتظار کریں</span>
          <span className="opacity-40">•</span>
          <span>{t('durood')}</span>
        </div>
      </div>
    </div>
  );
};

export default PublicDashboard;