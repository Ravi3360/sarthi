export interface Occupation {
  key: string;
  labelHi: string;
  iconKey: string; // Feather / MaterialCommunityIcons name
  groupKey: string;
  skillsHi: string[];
}

export interface OccupationGroup {
  key: string;
  labelHi: string;
}

export const occupationGroups: OccupationGroup[] = [
  { key: 'domestic', labelHi: 'घरेलू' },
  { key: 'security', labelHi: 'सुरक्षा' },
  { key: 'construction', labelHi: 'निर्माण' },
  { key: 'other', labelHi: 'अन्य' },
];

export const occupations: Occupation[] = [
  {
    key: 'maid',
    labelHi: 'नौकरानी/मेड',
    iconKey: 'home',
    groupKey: 'domestic',
    skillsHi: ['झाड़ू-पोछा', 'बर्तन धोना', 'कपड़े धोना', 'खाना बनाना'],
  },
  {
    key: 'cook',
    labelHi: 'रसोइया',
    iconKey: 'coffee',
    groupKey: 'domestic',
    skillsHi: ['भारतीय खाना', 'बेकिंग', 'शाकाहारी खाना', 'पार्टी खाना'],
  },
  {
    key: 'babysitter',
    labelHi: 'बेबीसिटर',
    iconKey: 'smile',
    groupKey: 'domestic',
    skillsHi: ['नवजात देखभाल', 'होमवर्क सहायता', 'खेल गतिविधियाँ'],
  },
  {
    key: 'caretaker',
    labelHi: 'केयरटेकर',
    iconKey: 'heart',
    groupKey: 'domestic',
    skillsHi: ['बुज़ुर्ग देखभाल', 'दवा याद दिलाना', 'शारीरिक सहायता'],
  },
  {
    key: 'society_guard',
    labelHi: 'सोसाइटी गार्ड',
    iconKey: 'shield',
    groupKey: 'security',
    skillsHi: ['निगरानी', 'विज़िटर रजिस्टर', 'सीसीटीवी'],
  },
  {
    key: 'office_guard',
    labelHi: 'ऑफिस गार्ड',
    iconKey: 'briefcase',
    groupKey: 'security',
    skillsHi: ['निगरानी', 'विज़िटर रजिस्टर', 'फायर सेफ्टी'],
  },
  {
    key: 'mason',
    labelHi: 'राजमिस्त्री',
    iconKey: 'tool',
    groupKey: 'construction',
    skillsHi: ['ईंट का काम', 'प्लास्टर', 'टाइलिंग'],
  },
  {
    key: 'carpenter',
    labelHi: 'बढ़ई',
    iconKey: 'scissors',
    groupKey: 'construction',
    skillsHi: ['फर्नीचर बनाना', 'दरवाज़े-खिड़की', 'पॉलिश'],
  },
  {
    key: 'painter',
    labelHi: 'पेंटर',
    iconKey: 'edit-3',
    groupKey: 'construction',
    skillsHi: ['दीवार पेंट', 'टेक्सचर', 'वार्निश'],
  },
  {
    key: 'electrician',
    labelHi: 'इलेक्ट्रिशियन',
    iconKey: 'zap',
    groupKey: 'construction',
    skillsHi: ['वायरिंग', 'स्विच-बोर्ड', 'मरम्मत'],
  },
  {
    key: 'plumber',
    labelHi: 'प्लंबर',
    iconKey: 'droplet',
    groupKey: 'construction',
    skillsHi: ['पाइप फिटिंग', 'नल मरम्मत', 'टंकी सफाई'],
  },
  {
    key: 'factory_worker',
    labelHi: 'फैक्ट्री वर्कर',
    iconKey: 'settings',
    groupKey: 'other',
    skillsHi: ['मशीन ऑपरेशन', 'पैकिंग', 'क्वालिटी चेक'],
  },
  {
    key: 'driver',
    labelHi: 'ड्राइवर',
    iconKey: 'truck',
    groupKey: 'other',
    skillsHi: ['कार चलाना', 'भारी वाहन', 'रूट जानकारी'],
  },
  {
    key: 'helper',
    labelHi: 'हेल्पर',
    iconKey: 'users',
    groupKey: 'other',
    skillsHi: ['सामान उठाना', 'सफाई सहायता', 'लोडिंग-अनलोडिंग'],
  },
  {
    key: 'delivery',
    labelHi: 'डिलीवरी',
    iconKey: 'package',
    groupKey: 'other',
    skillsHi: ['बाइक डिलीवरी', 'पार्सल हैंडलिंग', 'ऐप ऑर्डर'],
  },
];

export function getOccupation(key: string): Occupation | undefined {
  return occupations.find((o) => o.key === key);
}
