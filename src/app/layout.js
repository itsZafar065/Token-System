"use client";
import "./style.css";
import { AppProvider, useApp } from "@/context/AppContext";
import Nav from "@/components/Nav";
import { usePathname } from "next/navigation";

function LayoutContent({ children }) {
  const { isUrdu } = useApp();
  const pathname = usePathname();

  // In pages par hum Nav ya extra styling nahi dikhayenge
  const isDisplayPage = pathname === "/display";
  const isLoginPage = pathname === "/admin/login";

  return (
    <html lang={isUrdu ? "ur" : "en"} dir={isUrdu ? "rtl" : "ltr"}>
      <body className="antialiased bg-[#FDFCF0]">
        <div 
          className={`min-h-screen flex flex-col font-sans transition-all duration-300 ${isUrdu ? 'font-urdu' : ''}`}
        >
          {/* Navbar sirf tab dikhao jab display ya login page NA HO */}
          {!isDisplayPage && !isLoginPage && <Nav />}
          
          <main className={`flex-grow w-full overflow-x-hidden ${isDisplayPage ? 'h-screen' : ''}`}>
            {children}
          </main>

          {/* Global Loader Placeholder */}
          <div id="global-loader"></div>
        </div>
      </body>
    </html>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AppProvider>
      <LayoutContent>{children}</LayoutContent>
    </AppProvider>
  );
}