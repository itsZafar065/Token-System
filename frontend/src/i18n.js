import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        title: "Token System",
        welcome: "Welcome to Spiritual Services",
        subtitle: "Fill the form to get your queue number",
        // Form Labels
        name_label: "Full Name",
        parent_label: "Father / Mother Name",
        phone_label: "WhatsApp Number",
        residence_label: "Residence / City",
        issue_label: "Brief Issue Description",
        get_token_btn: "Generate Token",
        // Admin Labels
        name_title: "NAME:",
        parent_title: "FATHER/MOTHER:",
        phone_title: "PHONE NUMBER:",
        address_title: "ADDRESS:",
        issue_title: "ISSUE DETAILS:",
        date_title: "DATE:",
        // Dashboard & Status
        admin_panel: "Admin Dashboard",
        admin_login: "Admin Login",
        password_label: "Enter Passcode",
        login_btn: "Login",
        logout: "Logout / Exit",
        status_pending: "Waiting",
        status_done: "Completed",
        status_cancel: "Cancelled",
        actions: "Actions",
        whatsapp_btn: "WhatsApp Message",
        no_data: "No tokens found for today.",
        change_lang: "اردو میں بدلیں",
        token_title: "YOUR TOKEN NUMBER",
        another_token: "Get Another Token",
        success_msg: "Your token has been generated successfully.",
        wa_msg: "Assalam-o-Alaikum, your token number is:",

        // --- NEW FEATURES ---
        token_fees: "Token Fee: Rs. 200",
        download_btn: "Download Token Image",
        tokens_closed: "Tokens are currently closed",
        try_again_msg: "Please try again during the scheduled time.",
        settings_saved: "Settings updated successfully!",
        time_range: "Service Hours",
        export_report: "Export Excel Report",
        system_settings: "System Control Panel",

        // --- PUBLIC DASHBOARD KEYS ---
        now_serving: "Now Serving",
        upcoming: "Upcoming Next",
        no_pending: "No Pending Tokens",
        please_wait: "PLEASE WAIT",
        durood: "الصلوة والسلام عليك يا رسول الله",

        // --- ADMIN FEATURES ---
        call_btn: "Call (Voice)", 
        new_token_alert: "New Token Received!",
        reports: "Daily Reports",
        total_tokens: "Total Visitors",
        completed_today: "Finished",
        revenue: "Estimated Revenue",
        
        // --- ALERT MESSAGE ---
        save_success: "Token image saved to your gallery!"
      }
    },
    ur: {
      translation: {
        title: "ٹوکن سسٹم",
        welcome: "روحانی خدمات میں خوش آمدید",
        subtitle: "ٹوکن حاصل کرنے کے لیے نیچے دیا گیا فارم بھریں",
        // Form Labels
        name_label: "سائل کا پورا نام",
        parent_label: "والد یا والدہ کا نام", 
        phone_label: "واٹس ایپ نمبر",
        residence_label: "رہائش / پتہ / شہر",
        issue_label: "مسئلہ کی مختصر وضاحت",
        get_token_btn: "ٹوکن حاصل کریں",
        // Admin Labels
        name_title: "سائل کا نام:",
        parent_title: "والد یا والدہ ka نام:",
        phone_title: "فون نمبر:",
        address_title: "پتہ / شہر:",
        issue_title: "مسئلہ کی تفصیل:",
        date_title: "تاریخ:",
        // Dashboard & Status
        // LOCKING THESE TO ENGLISH AS REQUESTED
        admin_panel: "Admin Dashboard",
        admin_login: "Admin Login",
        password_label: "خفیہ کوڈ درج کریں",
        login_btn: "داخل ہوں",
        logout: "لاگ آؤٹ (باہر نکلیں)",
        status_pending: "انتظار گاہ",
        status_done: "مکمل ہو گیا",
        status_cancel: "منسوخ",
        actions: "کارروائی",
        whatsapp_btn: "واٹس ایپ کریں",
        no_data: "آج کی تاریخ میں کوئی ٹوکن موجود نہیں ہے۔",
        change_lang: "English Language",
        token_title: "آپ کا ٹوکن نمبر",
        another_token: "نیا ٹوکن حاصل کریں",
        success_msg: "آپ کا ٹوکن کامیابی سے بن گیا ہے۔",
        wa_msg: "السلام علیکم، آپ کا ٹوکن نمبر یہ ہے:",

        // --- NEW FEATURES ---
        token_fees: "ٹوکن فیس: 200 روپے",
        download_btn: "ٹوکن محفوظ کریں",
        tokens_closed: "ٹوکن بند ہیں",
        try_again_msg: "مقررہ وقت پر کوشش کریں۔",
        settings_saved: "ترتیبات محفوظ ہو گئیں!",
        time_range: "ٹوکن کا وقت",
        export_report: "Export Excel Report",
        system_settings: "System Control Panel",

        // --- PUBLIC DASHBOARD KEYS ---
        now_serving: "ابھی بلایا گیا",
        upcoming: "اگلے امیدوار",
        no_pending: "کوئی انتظار نہیں",
        please_wait: "انتظار فرمائیں",
        durood: "الصلوة والسلام عليك يا رسول الله",

        // --- ADMIN FEATURES ---
        call_btn: "پکاریں (آواز)", 
        new_token_alert: "نیا ٹوکن آگیا!",
        reports: "Daily Reports",
        total_tokens: "کل سائلین",
        completed_today: "مکمل ہوئے",
        revenue: "اندازہ آمدنی",

        // --- ALERT MESSAGE ---
        save_success: "ٹوکن آپ کی گیلری میں محفوظ ہو گیا ہے"
      }
    }
  },
  lng: "ur", 
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;