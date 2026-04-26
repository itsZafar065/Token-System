"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';

export default function TVDisplay() {
  const { isUrdu } = useApp();
  const [tokens, setTokens] = useState([]);
  const [nowServing, setNowServing] = useState(null);
  const lastCalledId = useRef(null); // Taake baar baar awaz na aaye

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens');
      const data = await res.json();
      if (data.success) {
        // 1. Calling Status check
        const calling = data.data.find(t => t.status === 'calling');
        setNowServing(calling);

        // 2. Voice Announcement Logic
        if (calling && calling._id !== lastCalledId.current) {
          announceToken(calling.tokenNumber);
          lastCalledId.current = calling._id;
        }

        // 3. Waiting List (Pending)
        const waiting = data.data.filter(t => t.status === 'pending');
        setTokens(waiting);
      }
    } catch (error) {
      console.error("Display Fetch Error");
    }
  };

  // Voice Function
  const announceToken = (num) => {
    const message = new SpeechSynthesisUtterance();
    message.text = `Token Number ${num}, please come.`;
    message.lang = 'en-US';
    message.rate = 0.8; // Thora sakoon se boley ga
    window.speechSynthesis.speak(message);
  };

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 4000); // Har 4 second baad check karega
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#064e3b] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* LEFT: NOW SERVING (Main Display) */}
      <div className="flex-[1.5] flex flex-col items-center justify-center p-10 border-b-8 md:border-b-0 md:border-r-[12px] border-[#fbbf24] bg-gradient-to-br from-[#064e3b] to-[#043d2e]">
        <h2 className="text-[#fbbf24] text-4xl md:text-6xl font-black uppercase tracking-[0.2em] mb-12 drop-shadow-lg">
          {isUrdu ? "ابھی بلایا گیا" : "Now Serving"}
        </h2>
        
        {nowServing ? (
          <div className="text-center">
            <div className="bg-[#fbbf24] text-[#064e3b] rounded-[5rem] px-24 py-12 shadow-[0_0_150px_rgba(251,191,36,0.5)] mb-10 animate-pulse">
              <span className="text-[180px] md:text-[300px] font-black italic leading-none drop-shadow-2xl">
                #{nowServing.tokenNumber}
              </span>
            </div>
            <h3 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white">
              {nowServing.name}
            </h3>
          </div>
        ) : (
          <div className="text-center opacity-20">
            <p className="text-5xl font-bold uppercase italic">{isUrdu ? "تیاری رکھیں" : "Get Ready"}</p>
          </div>
        )}
      </div>

      {/* RIGHT: WAITING QUEUE */}
      <div className="w-full md:w-[500px] bg-[#042f24] p-8 flex flex-col">
        <div className="flex justify-between items-center mb-8 border-b-4 border-[#fbbf24] pb-6">
          <h2 className="text-[#fbbf24] text-3xl font-black uppercase tracking-tight">
            {isUrdu ? "اگلی باری" : "Next In Line"}
          </h2>
          <span className="bg-[#fbbf24] text-[#064e3b] px-5 py-2 rounded-2xl font-black text-2xl shadow-inner">
            {tokens.length}
          </span>
        </div>

        <div className="space-y-4 overflow-y-auto pr-3 custom-scrollbar h-[70vh]">
          {tokens.map((token) => (
            <div 
              key={token._id} 
              className="flex items-center justify-between bg-[#064e3b] p-8 rounded-[2.5rem] border-l-[10px] border-[#fbbf24] shadow-xl transform transition-all"
            >
              <span className="text-5xl font-black italic text-[#fbbf24]">#{token.tokenNumber}</span>
              <span className="text-2xl font-bold uppercase truncate ml-6 text-white/90">{token.name}</span>
            </div>
          ))}
          {tokens.length === 0 && !nowServing && (
            <div className="h-full flex items-center justify-center opacity-20">
               <p className="text-2xl font-bold uppercase">No Active Queue</p>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER MESSAGE */}
      <div className="fixed bottom-0 w-full bg-[#fbbf24] text-[#064e3b] py-5 border-t-4 border-white/20">
        <marquee className="text-3xl font-black uppercase">
          {isUrdu 
            ? "براہ کرم اپنی باری آنے پر کاؤنٹر پر تشریف لائیں - آپ کے تعاون کا شکریہ" 
            : "PLEASE PROCEED TO THE COUNTER WHEN YOUR NUMBER IS CALLED - THANK YOU FOR YOUR PATIENCE"}
        </marquee>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #042f24; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fbbf24; border-radius: 20px; }
      `}</style>
    </div>
  );
}