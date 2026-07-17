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
        key: "personal.name",
        label: "पूरा नाम",
        autoCapitalize: "words",
      },
      {
        type: "chips",
        key: "personal.gender",
        label: "लिंग",
        options: [
          { key: "male", label: "पुरुष" },
          { key: "female", label: "महिला" },
          { key: "other", label: "अन्य" },
        ],
      },
      { type: "date", key: "personal.dob", label: "जन्म तिथि" },
    ],
  },
  {
    step: 2,
    title: "पहचान दस्तावेज़",
    fields: [
      {
        type: "text",
        key: "personal.aadhaar",
        label: "आधार नंबर",
        keyboardType: "numeric",
        maxLength: 12,
      },
      {
        type: "text",
        key: "personal.pan",
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
        key: "personal.maritalStatus",
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
        key: "personal.children",
        label: "बच्चों की संख्या",
        min: 0,
        max: 15,
      },
      {
        type: "stepper",
        key: "personal.dependents",
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
        key: "personal.photoUrl",
        label: "अपनी फ़ोटो लगाएँ",
        circular: true,
      },
      {
        type: "text",
        key: "personal.disability",
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
        addressKey: "personal.permanentAddress",
        stateKey: "personal.permanentState",
        districtKey: "personal.permanentDistrict",
      },
      { type: "text", key: "personal.permanentAddress", label: "स्थायी पता" },
      {
        type: "select",
        key: "personal.permanentState",
        label: "राज्य चुनें",
        options: indianStates.map((s) => ({ key: s, label: s })),
      },
      {
        type: "comboSelect",
        key: "personal.permanentDistrict",
        label: "जिला चुनें",
        options: [],
        parentKey: "personal.permanentState",
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
        addressKey: "personal.currentAddress",
        stateKey: "personal.currentState",
        districtKey: "personal.currentDistrict",
      },
      { type: "text", key: "personal.currentAddress", label: "वर्तमान पता" },
      {
        type: "select",
        key: "personal.currentState",
        label: "राज्य चुनें (वर्तमान)",
        options: indianStates.map((s) => ({ key: s, label: s })),
        optional: true,
      } as any,
      {
        type: "comboSelect",
        key: "personal.currentDistrict",
        label: "जिला चुनें (वर्तमान)",
        options: [],
        parentKey: "personal.currentState",
        optional: true,
      },
      {
        type: "text",
        key: "personal.nativeVillage",
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
        key: "professional.occupation",
        label: "व्यवसाय चुनें",
      },
    ],
  },
  {
    step: 8,
    title: "कौशल व अनुभव",
    fields: [
      { type: "text", key: "professional.primarySkill", label: "मुख्य कौशल" },
      {
        type: "stepper",
        key: "professional.experienceYears",
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
        key: "professional.expectedSalary",
        label: "अपेक्षित वेतन (₹/महीना)",
        keyboardType: "numeric",
        prefix: "₹",
      },
      {
        type: "chips",
        key: "professional.availability",
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
        key: "professional.education",
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
        key: "professional.languages",
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
      { type: "text", key: "financial.bankName", label: "बैंक का नाम" },
      {
        type: "text",
        key: "financial.accountNoMasked",
        label: "खाता नंबर",
        keyboardType: "numeric",
      },
      {
        type: "text",
        key: "financial.ifsc",
        label: "IFSC कोड",
        autoCapitalize: "characters",
        optional: true,
      },
      {
        type: "text",
        key: "financial.upiId",
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
        key: "financial.emergencyContactName",
        label: "आपातकालीन संपर्क नाम",
        autoCapitalize: "words",
      },
      {
        type: "text",
        key: "financial.emergencyContactPhone",
        label: "आपातकालीन संपर्क नंबर",
        keyboardType: "phone-pad",
        maxLength: 10,
      },
      {
        type: "chips",
        key: "health.migrationStatus",
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
