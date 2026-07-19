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
  | { type: "date"; key: string; label: string; optional?: boolean }
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
        type: "photo",
        key: "photoUrl",
        label: "अपनी फ़ोटो लगाएँ",
        circular: true,
        optional: true,
      },
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
    ],
  },
  {
    step: 2,
    title: "व्यवसाय चुनें",
    fields: [
      {
        type: "occupationPicker",
        key: "occupation",
        label: "व्यवसाय चुनें",
      },
    ],
  },
];

export const TOTAL_ONBOARDING_STEPS = onboardingSteps.length;
