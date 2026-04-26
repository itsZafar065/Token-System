"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useEffect, useState } from 'react';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isUrdu, setIsUrdu } = useApp();
  const [isAdmin, setIsAdmin] = useState(false);

  // TV View (display page) par Navbar ko chhupana
  if (pathname === '/display' || pathname === '/waiting') return null;

  // Check if user is logged in
  useEffect(() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('admin_token='));
    setIsAdmin(!!token);
  }, [pathname]);

  const isAuthPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isDashboard = pathname === '/admin/dashboard';

  // MODIFIED: Ab ye login ke bajaye Home Page (Token Generation) par bhejega
  const handleLogout = () => {
    // Cookie ko khatam karna
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; samesite=strict";
    // Redirect to Home Page (Jahan token generate hota hai)
    window.location.href = '/'; 
  };

  return (
    <nav className="bg-white shadow-md border-b-4 border-[#0D4D33] p-2 md:p-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-2">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-[#FDFCF0] rounded-xl flex items-center justify-center shadow-inner border border-[#0D4D33]/10 overflow-hidden">
            <img 
              src="/favicon.ico" 
              alt="Logo" 
              className="w-6 h-6 md:w-8 md:h-8 object-contain"
              onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/2913/2913520.png" }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-[#0D4D33] text-[10px] md:text-lg tracking-tighter leading-none uppercase">
              {isUrdu ? 'ٹوکن سسٹم' : 'TOKEN SYSTEM'}
            </span>
          </div>
        </Link>
        
        {/* Navigation Section */}
        <div className="flex items-center gap-1.5 md:gap-4">
          
          <Link 
            href="/display" 
            target="_blank"
            className="text-[9px] md:text-xs font-black text-[#0D4D33] bg-[#FDFCF0] px-2 md:px-3 py-2 rounded-xl border-2 border-[#0D4D33]/20 hover:bg-[#0D4D33] hover:text-white transition-all shadow-sm flex items-center gap-1"
          >
            <span className="text-sm md:text-base">📺</span>
            <span className="hidden xs:inline">{isUrdu ? 'ٹی وی' : 'TV VIEW'}</span>
          </Link>

          {/* Admin Buttons Logic */}
          {(isAuthPage || isAdmin) ? (
            <div className="flex gap-1.5 md:gap-2">
              {!isDashboard && (
                <Link 
                  href="/admin/dashboard" 
                  className="text-[9px] md:text-xs font-black text-white bg-[#0D4D33] px-2 md:px-3 py-2 rounded-xl shadow-md"
                >
                  {isUrdu ? 'ڈیش بورڈ' : 'DASHBOARD'}
                </Link>
              )}
              {/* EXIT Button: Ab ye handleLogout ke zariye home par le jayega */}
              <button 
                onClick={handleLogout} 
                className="text-[9px] md:text-xs font-black text-white bg-[#800000] px-2 md:px-3 py-2 rounded-xl shadow-md active:scale-95 transition-transform cursor-pointer"
              >
                {isUrdu ? 'باہر نکلیں' : 'EXIT'}
              </button>
            </div>
          ) : (
            pathname !== '/admin/login' && (
              <Link 
                href="/admin/login" 
                className="text-[9px] md:text-xs font-black text-[#0D4D33]/60 uppercase px-1 md:px-2 hover:text-[#0D4D33] transition-colors"
              >
                {isUrdu ? 'لاگ ان' : 'LOGIN'}
              </Link>
            )
          )}

          <button 
            onClick={() => setIsUrdu(!isUrdu)} 
            className="bg-[#D47E1B] text-white px-3 md:px-6 py-2 md:py-2.5 rounded-full text-[9px] md:text-sm font-black shadow-lg hover:brightness-110 active:scale-95 transition-all border-b-4 border-black/20"
          >
            {isUrdu ? 'ENGLISH' : 'اردو'}
          </button>
        </div>
      </div>
    </nav>
  );
}