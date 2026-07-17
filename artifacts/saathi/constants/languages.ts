export interface LanguageOption {
  key: string;
  labelHi: string;
  labelNative: string;
  enabled: boolean;
}

export const appLanguages: LanguageOption[] = [
  { key: 'hi', labelHi: 'हिंदी', labelNative: 'हिंदी', enabled: true },
  { key: 'en', labelHi: 'अंग्रेज़ी', labelNative: 'English', enabled: false },
  { key: 'bn', labelHi: 'बंगाली', labelNative: 'বাংলা', enabled: false },
  { key: 'ta', labelHi: 'तमिल', labelNative: 'தமிழ்', enabled: false },
  { key: 'te', labelHi: 'तेलुगु', labelNative: 'తెలుగు', enabled: false },
  { key: 'mr', labelHi: 'मराठी', labelNative: 'मराठी', enabled: false },
];

export const workerLanguages: string[] = [
  'हिंदी',
  'भोजपुरी',
  'मैथिली',
  'अंग्रेज़ी',
  'मराठी',
  'बंगाली',
  'तमिल',
  'तेलुगु',
  'कन्नड़',
  'गुजराती',
  'पंजाबी',
  'उर्दू',
];
