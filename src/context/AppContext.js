"use client";
import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isUrdu, setIsUrdu] = useState(false);

  // Translations Object
  const t = {
    en: {
      welcome: "WELCOME",
      sub: "PLEASE ENTER YOUR DETAILS",
      name: "Full Name",
      phone: "Phone Number",
      residence: "Residence/City",
      issue: "Issue/Reason",
      btn: "GET TOKEN",
      adminTitle: "Admin Dashboard",
      logout: "LOGOUT",
      report: "DOWNLOAD EXCEL",
      timing: "SET TIMING",
    },
    ur: {
      welcome: "خوش آمدید",
      sub: "براہ کرم اپنی تفصیلات درج کریں",
      name: "مکمل نام",
      phone: "فون نمبر",
      residence: "رہائش / شہر",
      issue: "مسئلہ / وجہ",
      btn: "ٹوکن حاصل کریں",
      adminTitle: "ایڈمن ڈیش بورڈ",
      logout: "لاگ آؤٹ",
      report: "ایکسل رپورٹ",
      timing: "وقت سیٹ کریں",
    }
  };

  const content = isUrdu ? t.ur : t.en;

  return (
    <AppContext.Provider value={{ isUrdu, setIsUrdu, content }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);