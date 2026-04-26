"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Pusher from 'pusher-js';

export default function TVDisplay() {
  const { isUrdu } = useApp();
  const [tokens, setTokens] = useState([]);
  const [nowServing, setNowServing] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const lastCalledId = useRef(null);

  // 1. Fetch Tokens and Update State
  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens');
      const data = await res.json();
      if (data.success) {
        // Find current calling token
        const calling = data.data.find(t => t.status === 'calling');
        setNowServing(calling);

        // Auto Announcement Logic
        if (calling && calling._id !== lastCalledId.current) {
          if (audioEnabled) {
            announceToken(calling.tokenNumber, calling.name);
          }
          lastCalledId.current = calling._id;
        }

        // Filter and sort waiting tokens
        const waiting = data.data
          .filter(t => t.status === 'pending')
          .sort((a, b) => a.tokenNumber - b.tokenNumber);
        setTokens(waiting);
      }
    } catch (error) {
      console.error("Display Fetch Error:", error);
    }
  };

  // 2. Professional Voice Announcement
  const announceToken = (num, name) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Purani announcement roko
      const msg = new SpeechSynthesisUtterance();
      
      // Bilingual announcement
      msg.text = isUrdu 
        ? `ٹوکن نمبر ${num}, ${name}, براہ کرم کاؤنٹر پر تشریف لائیں`
        : `Token Number ${num}, ${name}, please proceed to the counter.`;
      
      msg.rate = 0.85;
      msg.pitch = 1;
      msg.volume = 1;
      
      window.speechSynthesis.speak(msg);
    }
  };

  // 3. Real-time Connection (Pusher)
  useEffect(() => {
    fetchTokens();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe('token-channel');
    channel.bind('token-updated', () => {
      console.log("⚡ Signal Received: Updating Display...");
      fetchTokens();
    });

    return () => {
      pusher.unsubscribe('token-channel');
      window.speechSynthesis.cancel();
    };
  }, [audioEnabled]);

  return (
    <div className="min-h-screen bg-[#064e3b] text-white flex flex-col md:flex-row overflow-hidden font-sans select-none">
      
      {/* AUDIO OVERLAY: Browser security ki wajah se ye zaroori hai */}
      {!audioEnabled && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[#fbbf24] p-8 rounded-[3rem] shadow-2xl">
            <h2 className="text-[#064e3b] text-2xl font-black mb-4">
              {isUrdu ? "آڈیو سسٹم کو فعال کریں" : "ACTIVATE AUDIO SYSTEM"}
            </h2>
            <button 
              onClick={() => { setAudioEnabled(true); announceToken('', ''); }}
              className="bg-[#064e3b] text-white px-10 py-4 rounded-2xl font-black uppercase hover:scale-105 transition-all"
            >
              {isUrdu ? "شروع کریں" : "START DISPLAY"}
            </button>
          </div>
        </div>
      )}

      {/* LEFT SIDE: NOW SERVING */}
      <div className="flex-[1.5] flex flex-col items-center justify-center p-6 md:p-10 border-b-8 md:border-b-0 md:border-r-8 border-[#fbbf24] bg-gradient-to-br from-[#064e3b] to-[#043d2e]">
        <div className="text-center mb-6">
           <img src="/favicon.ico" alt="Logo" className="w-20 h-20 mx-auto mb-4 opacity-80" />
           <h2 className="text-[#fbbf24] text-3xl md:text-5xl font-black uppercase tracking-[0.2em]">
            {isUrdu ? "ابھی بلایا گیا" : "Now Serving"}
          </h2>
        </div>
        
        {nowServing ? (
          <div className="text-center w-full">
            <div className="bg-[#fbbf24] text-[#064e3b] rounded-[3rem] md:rounded-[5rem] py-10 md:py-20 shadow-[0_0_100px_rgba(251,191,36,0.2)] mb-8 animate-pulse-slow">
              <span className="text-[120px] md:text-[280px] font-black italic leading-none block drop-shadow-2xl">
                #{nowServing.tokenNumber}
              </span>
            </div>
            <h3 className="text-4xl md:text-7xl font-black uppercase tracking-tight text-white drop-shadow-lg">
              {nowServing.name}
            </h3>
          </div>
        ) : (
          <div className="text-center opacity-20">
            <p className="text-4xl md:text-6xl font-black uppercase tracking-widest italic animate-pulse">
              {isUrdu ? "اگلے ٹوکن کا انتظار" : "Waiting for Next"}
            </p>
          </div>
        )}
      </div>

      {/* RIGHT SIDE: WAITING LIST */}
      <div className="w-full md:w-[450px] bg-[#043d2e] p-6 md:p-8 flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b-4 border-[#fbbf24] pb-6">
          <h2 className="text-[#fbbf24] text-2xl font-black uppercase">
            {isUrdu ? "انتظار گاہ" : "Next in Queue"}
          </h2>
          <div className="bg-[#fbbf24] text-[#064e3b] px-4 py-1 rounded-xl font-black text-xl">
            {tokens.length}
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {tokens.slice(0, 7).map((token) => (
            <div key={token._id} className="flex items-center justify-between bg-white/5 p-5 rounded-3xl border-l-8 border-[#fbbf24] hover:bg-white/10 transition-all">
              <span className="text-4xl font-black italic text-[#fbbf24]">#{token.tokenNumber}</span>
              <span className="text-lg font-bold uppercase truncate ml-4 text-white/80">{token.name}</span>
            </div>
          ))}
          
          {tokens.length === 0 && !nowServing && (
            <div className="h-full flex items-center justify-center opacity-10">
               <p className="text-2xl font-black uppercase -rotate-12 italic border-4 p-4 border-white">Counter Closed</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER MARQUEE */}
      <div className="fixed bottom-0 w-full bg-[#fbbf24] text-[#064e3b] py-3 border-t-4 border-white/20 shadow-2xl">
        <marquee className="text-2xl md:text-3xl font-black uppercase">
          <span className="mx-10">اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ</span>
          <span className="mx-10">•</span>
          <span>{isUrdu ? "اپنی باری پر کاؤنٹر پر تشریف لائیں" : "Please proceed to the counter when called"}</span>
          <span className="mx-10">•</span>
          <span className="mx-10">اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ</span>
        </marquee>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 10px; }
        .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .8; } }
      `}</style>
    </div>
  );
} 