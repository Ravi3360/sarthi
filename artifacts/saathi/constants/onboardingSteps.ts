import { occupations } from "@/constants/occupations";
import { indianStates } from "@/constants/states";
import { workerLanguages } from "@/constants/languages";

export type FieldDescriptor =
  | {
      type: "text";
      key: string;
      label: string;
      keyboardType?: "default" | "numeric" | "phone-pad";
      maxLength?: number;
      prefix?: string;
      optional?: boolean;
      autoCapitalize?: "none" | "words" | "characters";
    }
  | {
      type: "chips";
      key: string;
      label: string;
      options: { key: string; label: string }[];
      multi?: boolean;
      optional?: boolean;
    }
  | { type: "stepper"; key: string; label: string; min: number; max: number }
  | { type: "date"; key: string; label: string }
  | {
      type: "select";
      key: string;
      label: string;
      options: { key: string; label: string }[];
      optional?: boolean;
    }
  | {
      type: "comboSelect";
      key: string;
      label: string;
      options: { key: string; label: string }[];
      parentKey?: string;
      optional?: boolean;
    }
  | {
      type: "photo";
      key: string;
      label: string;
      circular?: boolean;
      optional?: boolean;
    }
  | { type: "occupationPicker"; key: string; label: string }
  | {
      type: "locationFill";
      label: string;
      addressKey: string;
      stateKey: string;
      districtKey: string;
    };

export interface OnboardingStep {
  step: number;
  title: string;
  fields: FieldDescriptor[];
}

export const onboardingSteps: OnboardingStep[] = [
  {
    step: 1,
    title: "बुनियादी जानकारी",
    fields: [
      {
        type: "text",
        key: "name",
        label: "पूरा नाम",
        autoCapitalize: "words",
      },
      {
        type: "chips",
        key: "gender",
        label: "लिंग",
        options: [
          { key: "male", label: "पुरुष" },
          { key: "female", label: "महिला" },
          { key: "other", label: "अन्य" },
        ],
      },
      { type: "date", key: "dob", label: "जन्म तिथि" },
    ],
  },
  {
    step: 2,
    title: "पहचान दस्तावेज़",
    fields: [
      {
        type: "text",
        key: "aadhaar",
        label: "आधार नंबर",
        keyboardType: "numeric",
        maxLength: 12,
      },
      {
        type: "text",
        key: "pan",
        label: "पैन नंबर (वैकल्पिक)",
        maxLength: 10,
        optional: true,
        autoCapitalize: "characters",
      },
    ],
  },
  {
    step: 3,
    title: "पारिवारिक जानकारी",
    fields: [
      {
        type: "chips",
        key: "maritalStatus",
        label: "वैवाहिक स्थिति",
        options: [
          { key: "unmarried", label: "अविवाहित" },
          { key: "married", label: "विवाहित" },
          { key: "widowed", label: "विधवा/विधुर" },
          { key: "divorced", label: "तलाकशुदा" },
        ],
      },
      {
        type: "stepper",
        key: "children",
        label: "बच्चों की संख्या",
        min: 0,
        max: 15,
      },
      {
        type: "stepper",
        key: "dependents",
        label: "आश्रितों की संख्या",
        min: 0,
        max: 15,
      },
    ],
  },
  {
    step: 4,
    title: "फ़ोटो व स्वास्थ्य",
    fields: [
      {
        type: "photo",
        key: "photoUrl",
        label: "अपनी फ़ोटो लगाएँ",
        circular: true,
      },
      {
        type: "text",
        key: "disability",
        label: "दिव्यांगता (अगर कोई हो)",
        optional: true,
      },
    ],
  },
  {
    step: 5,
    title: "स्थायी पता",
    fields: [
      {
        type: "locationFill",
        label: "GPS से पता भरें",
        addressKey: "permanentAddress",
        stateKey: "permanentState",
        districtKey: "permanentDistrict",
      },
      { type: "text", key: "permanentAddress", label: "स्थायी पता" },
      {
        type: "select",
        key: "permanentState",
        label: "राज्य चुनें",
        options: indianStates.map((s) => ({ key: s, label: s })),
      },
      {
        type: "comboSelect",
        key: "permanentDistrict",
        label: "जिला चुनें",
        options: [],
        parentKey: "permanentState",
        optional: true,
      },
    ],
  },
  {
    step: 6,
    title: "वर्तमान पता",
    fields: [
      {
        type: "locationFill",
        label: "GPS से पता भरें",
        addressKey: "currentAddress",
        stateKey: "currentState",
        districtKey: "currentDistrict",
      },
      { type: "text", key: "currentAddress", label: "वर्तमान पता" },
      {
        type: "select",
        key: "currentState",
        label: "राज्य चुनें (वर्तमान)",
        options: indianStates.map((s) => ({ key: s, label: s })),
        optional: true,
      },
      {
        type: "comboSelect",
        key: "currentDistrict",
        label: "जिला चुनें (वर्तमान)",
        options: [],
        parentKey: "currentState",
        optional: true,
      },
      {
        type: "text",
        key: "nativeVillage",
        label: "मूल गाँव/शहर",
        optional: true,
      },
    ],
  },
  {
    step: 7,
    title: "व्यवसाय चुनें",
    fields: [
      {
        type: "occupationPicker",
        key: "occupation",
        label: "व्यवसाय चुनें",
      },
    ],
  },
  {
    step: 8,
    title: "कौशल व अनुभव",
    fields: [
      { type: "text", key: "primarySkill", label: "मुख्य कौशल" },
      {
        type: "stepper",
        key: "experienceYears",
        label: "अनुभव (साल)",
        min: 0,
        max: 50,
      },
    ],
  },
  {
    step: 9,
    title: "वेतन व उपलब्धता",
    fields: [
      {
        type: "text",
        key: "expectedSalary",
        label: "अपेक्षित वेतन (₹/महीना)",
        keyboardType: "numeric",
        prefix: "₹",
      },
      {
        type: "chips",
        key: "availability",
        label: "उपलब्धता",
        options: [
          { key: "full_time", label: "फुल-टाइम" },
          { key: "part_time", label: "पार्ट-टाइम" },
          { key: "on_call", label: "ऑन-कॉल" },
        ],
      },
    ],
  },
  {
    step: 10,
    title: "शिक्षा व भाषाएँ",
    fields: [
      {
        type: "chips",
        key: "education",
        label: "शिक्षा",
        options: [
          { key: "illiterate", label: "निरक्षर" },
          { key: "primary", label: "प्राथमिक" },
          { key: "secondary", label: "माध्यमिक" },
          { key: "higher_secondary", label: "उच्चतर माध्यमिक" },
          { key: "graduate", label: "स्नातक+" },
        ],
      },
      {
        type: "chips",
        key: "languages",
        label: "भाषाएँ",
        multi: true,
        options: workerLanguages.map((l) => ({ key: l, label: l })),
      },
    ],
  },
  {
    step: 11,
    title: "बैंक जानकारी",
    fields: [
      { type: "text", key: "bankName", label: "बैंक का नाम" },
      {
        type: "text",
        key: "accountNoMasked",
        label: "खाता नंबर",
        keyboardType: "numeric",
      },
      {
        type: "text",
        key: "ifsc",
        label: "IFSC कोड",
        autoCapitalize: "characters",
        optional: true,
      },
      {
        type: "text",
        key: "upiId",
        label: "UPI आईडी (वैकल्पिक)",
        optional: true,
      },
    ],
  },
  {
    step: 12,
    title: "आपातकालीन संपर्क",
    fields: [
      {
        type: "text",
        key: "emergencyContactName",
        label: "आपातकालीन संपर्क नाम",
        autoCapitalize: "words",
      },
      {
        type: "text",
        key: "emergencyContactPhone",
        label: "आपातकालीन संपर्क नंबर",
        keyboardType: "phone-pad",
        maxLength: 10,
      },
      {
        type: "chips",
        key: "migrationStatus",
        label: "प्रवासन स्थिति",
        options: [
          { key: "local", label: "स्थानीय" },
          { key: "migrant", label: "प्रवासी" },
        ],
      },
    ],
  },
];

export const TOTAL_ONBOARDING_STEPS = onboardingSteps.length;
