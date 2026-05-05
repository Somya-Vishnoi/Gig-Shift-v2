export interface Platform {
  id: string;
  name: string;
  color: string;
}

export interface DataRow {
  timestamp: number;
  hour: number;
  dayOfWeek: number;
  platformId: string;
  zone: string;
  demand: number;
  supply: number;
  basePPD: number;
  surgeMult: number;
  ppd: number;
  shortage: number;
  fulfillmentRate: number;
  weather: "clear" | "rain" | "heavy_rain";
  eventBoost: boolean;
}

export interface MarketSnapshot {
  platformId: string;
  demand: number;
  supply: number;
  shortage: number;
  ppd: number;
  surgeMult: number;
  fulfillmentRate: number;
  trend: "up" | "down" | "stable";
}

export interface WeeklyRow {
  day: string;
  [platformId: string]: string | number;
}

export type Role = "rider" | "platform" | "admin";

export interface AuthState {
  role: Role;
  name: string;
  email: string;
  mobile: string;
  language: string;
}

export const PLATFORMS: Platform[] = [
  { id: "swft",   name: "Swft",   color: "#059669" },
  { id: "grubgo", name: "GrubGo", color: "#0D9488" },
  { id: "dropd",  name: "Dropd",  color: "#0891B2" },
  { id: "rushly", name: "Rushly", color: "#7C3AED" },
];

export const ZONES = [
  "Koramangala", "Indiranagar", "HSR Layout", "Whitefield",
  "Jayanagar", "MG Road", "Electronic City", "Marathahalli",
  "BTM Layout", "JP Nagar",
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "te", label: "తెలుగు" },
  { code: "ta", label: "தமிழ்" },
];

// UI string translations — extend per screen
export const UI_STRINGS: Record<string, Record<string, string>> = {
  en: {
    appName: "GigShift",
    tagline: "Gig Economy Intelligence",
    emailLabel: "Email address",
    mobileLabel: "Mobile number",
    roleLabel: "I am a",
    roleRider: "Rider",
    rolePlatform: "Platform",
    continueBtn: "Continue",
    emailError: "Enter a valid email address",
    mobileError: "Enter a valid 10-digit mobile number",
    roleError: "Select your role to continue",
    adminDetected: "Admin access",
    liveLabel: "Live",
    loading: "Loading...",
    logout: "Sign out",
    darkMode: "Dark mode",
    lightMode: "Light mode",
  },
  hi: {
    appName: "GigShift",
    tagline: "गिग इकोनॉमी इंटेलिजेंस",
    emailLabel: "ईमेल पता",
    mobileLabel: "मोबाइल नंबर",
    roleLabel: "मैं हूँ",
    roleRider: "राइडर",
    rolePlatform: "प्लेटफ़ॉर्म",
    continueBtn: "जारी रखें",
    emailError: "वैध ईमेल पता दर्ज करें",
    mobileError: "10 अंकों का मोबाइल नंबर दर्ज करें",
    roleError: "जारी रखने के लिए भूमिका चुनें",
    adminDetected: "एडमिन एक्सेस",
    liveLabel: "लाइव",
    loading: "लोड हो रहा है...",
    logout: "साइन आउट",
    darkMode: "डार्क मोड",
    lightMode: "लाइट मोड",
  },
  kn: {
    appName: "GigShift",
    tagline: "ಗಿಗ್ ಎಕಾನಮಿ ಇಂಟೆಲಿಜೆನ್ಸ್",
    emailLabel: "ಇಮೇಲ್ ವಿಳಾಸ",
    mobileLabel: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    roleLabel: "ನಾನು",
    roleRider: "ರೈಡರ್",
    rolePlatform: "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್",
    continueBtn: "ಮುಂದುವರಿಯಿರಿ",
    emailError: "ಮಾನ್ಯ ಇಮೇಲ್ ವಿಳಾಸ ನಮೂದಿಸಿ",
    mobileError: "10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
    roleError: "ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಪಾತ್ರ ಆಯ್ಕೆ ಮಾಡಿ",
    adminDetected: "ಅಡ್ಮಿನ್ ಪ್ರವೇಶ",
    liveLabel: "ಲೈವ್",
    loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
    logout: "ಸೈನ್ ಔಟ್",
    darkMode: "ಡಾರ್ಕ್ ಮೋಡ್",
    lightMode: "ಲೈಟ್ ಮೋಡ್",
  },
  te: {
    appName: "GigShift",
    tagline: "గిగ్ ఎకానమీ ఇంటెలిజెన్స్",
    emailLabel: "ఇమెయిల్ చిరునామా",
    mobileLabel: "మొబైల్ నంబర్",
    roleLabel: "నేను",
    roleRider: "రైడర్",
    rolePlatform: "ప్లాట్‌ఫారమ్",
    continueBtn: "కొనసాగించు",
    emailError: "చెల్లుబాటు అయ్యే ఇమెయిల్ చిరునామా నమోదు చేయండి",
    mobileError: "10 అంకెల మొబైల్ నంబర్ నమోదు చేయండి",
    roleError: "కొనసాగించడానికి మీ పాత్రను ఎంచుకోండి",
    adminDetected: "అడ్మిన్ యాక్సెస్",
    liveLabel: "లైవ్",
    loading: "లోడ్ అవుతోంది...",
    logout: "సైన్ అవుట్",
    darkMode: "డార్క్ మోడ్",
    lightMode: "లైట్ మోడ్",
  },
  ta: {
    appName: "GigShift",
    tagline: "கிக் பொருளாதார நுண்ணறிவு",
    emailLabel: "மின்னஞ்சல் முகவரி",
    mobileLabel: "மொபைல் எண்",
    roleLabel: "நான்",
    roleRider: "ரைடர்",
    rolePlatform: "பிளாட்ஃபார்ம்",
    continueBtn: "தொடரவும்",
    emailError: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்",
    mobileError: "10 இலக்க மொபைல் எண்ணை உள்ளிடவும்",
    roleError: "தொடர உங்கள் பாத்திரத்தை தேர்ந்தெடுக்கவும்",
    adminDetected: "நிர்வாக அணுகல்",
    liveLabel: "நேரடி",
    loading: "ஏற்றுகிறது...",
    logout: "வெளியேறு",
    darkMode: "இருண்ட முறை",
    lightMode: "ஒளி முறை",
  },
};

export function t(lang: string, key: string): string {
  return UI_STRINGS[lang]?.[key] ?? UI_STRINGS["en"][key] ?? key;
}

// Pitch-ready KPI constants for demo/presentation
export const PITCH_STATS = {
  totalRidersOnboarded: 2847,
  totalPlatformPartners: 12,
  avgSLARate: 94.2,
  avgDispatchMinutes: 4.3,
  citiesCovered: 3,
  monthlyOrdersSimulated: 18400,
  totalRevenueSimulated: 2400000,
  // aliases used by AdminDashboard
  totalRiders: 2847,
  dispatchedThisMonth: "18,400",
  slaRate: "94.2%",
}
