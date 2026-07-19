import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { BottomSheet } from '@/components/BottomSheet';
import { Chip, PrimaryButton, TextButton } from '@/components/ui';
import { searchBankSuggestions } from '@/constants/bankIfsc';

// ---------------------------------------------------------------------------
// FieldInput
// ---------------------------------------------------------------------------

interface FieldInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  helper?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  maxLength?: number;
  autoCapitalize?: 'none' | 'characters' | 'words';
  multiline?: boolean;
  prefix?: string;
  icon?: keyof typeof Feather.glyphMap;
}

export function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helper,
  keyboardType = 'default',
  maxLength,
  autoCapitalize = 'none',
  multiline,
  prefix,
  icon,
}: FieldInputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            borderColor: error ? colors.error : focused ? colors.primary : colors.border,
            backgroundColor: colors.background,
            minHeight: multiline ? 96 : 52,
          },
        ]}
      >
        {icon && <Feather name={icon} size={18} color={colors.mutedForeground} />}
        {prefix && <Text style={{ fontSize: 16, color: colors.mutedForeground, fontWeight: '600' }}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: colors.foreground, paddingTop: multiline ? 14 : 0 }]}
        />
      </View>
      {error ? (
        <Text style={[styles.helperText, { color: colors.error }]}>{error}</Text>
      ) : helper ? (
        <Text style={[styles.helperText, { color: colors.mutedForeground }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// BankSuggestField — bank name input with IFSC code suggestions
// ---------------------------------------------------------------------------

export function BankSuggestField({
  bankName,
  onBankNameChange,
  onIfscSelect,
}: {
  bankName: string;
  onBankNameChange: (text: string) => void;
  onIfscSelect: (bankName: string, ifsc: string) => void;
}) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const suggestions = searchBankSuggestions(bankName);

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>बैंक का नाम</Text>
      <View
        style={[
          styles.inputRow,
          { borderColor: focused ? colors.primary : colors.border, backgroundColor: colors.background },
        ]}
      >
        <Feather name="credit-card" size={18} color={colors.mutedForeground} />
        <TextInput
          value={bankName}
          onChangeText={onBankNameChange}
          placeholder="जैसे: State Bank of India, HDFC"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="words"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: colors.foreground }]}
        />
      </View>
      {suggestions.length > 0 && (
        <View style={[styles.suggestBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
            📋 IFSC चुनें या नीचे खुद भरें
          </Text>
          {suggestions.map((s) => (
            <Pressable
              key={s.ifsc}
              onPress={() => onIfscSelect(s.bankName, s.ifsc)}
              style={[styles.suggestRow, { borderTopColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>{s.ifsc}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>{s.branch}</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stepper — numeric +/- control
// ---------------------------------------------------------------------------

export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const colors = useColors();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={[styles.stepperRow, { borderColor: colors.border }]}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          style={[styles.stepperBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="minus" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.stepperValue, { color: colors.foreground }]}>{value}</Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          style={[styles.stepperBtn, { backgroundColor: colors.muted }]}
        >
          <Feather name="plus" size={20} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ChipSelect — single or multi select chips
// ---------------------------------------------------------------------------

export function ChipSelect({
  label,
  options,
  value,
  onChange,
  multi,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  multi?: boolean;
}) {
  const colors = useColors();
  const toggle = (key: string) => {
    if (multi) {
      onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
    } else {
      onChange([key]);
    }
  };
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((opt) => (
          <Chip key={opt.key} label={opt.label} selected={value.includes(opt.key)} onPress={() => toggle(opt.key)} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SelectField — bottom-sheet single-select "dropdown"
// ---------------------------------------------------------------------------

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'चुनें',
}: {
  label: string;
  value: string | null;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
  placeholder?: string;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.key === value)?.label;

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}
      >
        <Text style={{ flex: 1, fontSize: 16, color: selectedLabel ? colors.foreground : colors.mutedForeground }}>
          {selectedLabel ?? placeholder}
        </Text>
        <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{label}</Text>
        <ScrollView style={{ maxHeight: 360 }}>
          {options.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              style={[styles.sheetOption, { borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 16, color: colors.foreground, flex: 1 }}>{opt.label}</Text>
              {opt.key === value && <Feather name="check" size={20} color={colors.primary} />}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ComboSelectField — searchable bottom-sheet select (type to filter + scroll)
// ---------------------------------------------------------------------------

export function ComboSelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'खोजें या चुनें',
  disabled,
}: {
  label: string;
  value: string | null;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selectedLabel = options.find((o) => o.key === value)?.label;

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <Pressable
        onPress={() => { if (!disabled) { setQuery(''); setOpen(true); } }}
        style={[
          styles.inputRow,
          {
            borderColor: colors.border,
            backgroundColor: colors.background,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text style={{ flex: 1, fontSize: 16, color: selectedLabel ? colors.foreground : colors.mutedForeground }}>
          {selectedLabel ?? (disabled ? 'पहले राज्य चुनें' : placeholder)}
        </Text>
        <Feather name="search" size={18} color={colors.mutedForeground} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{label}</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background, marginBottom: 8 }]}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="खोजें…"
            placeholderTextColor={colors.mutedForeground}
            autoFocus
            style={[styles.input, { color: colors.foreground }]}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
          {filtered.length === 0 && (
            <Text style={{ padding: 16, color: colors.mutedForeground, textAlign: 'center' }}>
              कोई परिणाम नहीं
            </Text>
          )}
          {filtered.map((opt) => (
            <Pressable
              key={opt.key}
              onPress={() => {
                onChange(opt.key);
                setOpen(false);
              }}
              style={[styles.sheetOption, { borderColor: colors.border }]}
            >
              <Text style={{ fontSize: 16, color: colors.foreground, flex: 1 }}>{opt.label}</Text>
              {opt.key === value && <Feather name="check" size={20} color={colors.primary} />}
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DateField — day/month/year selects via bottom sheets (cross-platform safe)
// ---------------------------------------------------------------------------

const hindiMonths = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्तूबर', 'नवंबर', 'दिसंबर',
];

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null; // ISO date
  onChange: (iso: string) => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Hold day/month/year as local draft state so each picker reflects the
  // user's choice immediately — the parent `value` only becomes a full ISO
  // date once all three parts are selected, so we can't derive display
  // state straight from it (partial selections would appear to vanish).
  const initial = value ? new Date(value) : null;
  const [day, setDay] = useState<number | null>(initial?.getDate() ?? null);
  const [month, setMonth] = useState<number | null>(initial ? initial.getMonth() : null);
  const [year, setYear] = useState<number | null>(initial?.getFullYear() ?? null);

  const update = (d: number | null, m: number | null, y: number | null) => {
    setDay(d);
    setMonth(m);
    setYear(y);
    if (d && m !== null && y) {
      const iso = new Date(Date.UTC(y, m, d)).toISOString();
      onChange(iso);
    }
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: '#1A1A1A' }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SelectField
            label=""
            value={day ? String(day) : null}
            options={days.map((d) => ({ key: String(d), label: String(d) }))}
            onChange={(v) => update(Number(v), month, year)}
            placeholder="दिन"
          />
        </View>
        <View style={{ flex: 1.4 }}>
          <SelectField
            label=""
            value={month !== null ? String(month) : null}
            options={hindiMonths.map((m, i) => ({ key: String(i), label: m }))}
            onChange={(v) => update(day, Number(v), year)}
            placeholder="महीना"
          />
        </View>
        <View style={{ flex: 1 }}>
          <SelectField
            label=""
            value={year ? String(year) : null}
            options={years.map((y) => ({ key: String(y), label: String(y) }))}
            onChange={(v) => update(day, month, Number(v))}
            placeholder="साल"
          />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PhotoPickerField — camera / gallery via expo-image-picker
// ---------------------------------------------------------------------------

export function PhotoPickerField({
  label,
  value,
  onChange,
  circular,
}: {
  label: string;
  value: string | null;
  onChange: (uri: string) => void;
  circular?: boolean;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  const pickFrom = async (source: 'camera' | 'gallery') => {
    setOpen(false);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: circular })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsEditing: circular });

    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.photoBox,
          circular && styles.photoBoxCircular,
          { borderColor: colors.border, backgroundColor: colors.muted },
        ]}
      >
        {value ? (
          <PhotoPreview uri={value} circular={circular} />
        ) : (
          <View style={{ alignItems: 'center', gap: 6 }}>
            <Feather name="camera" size={28} color={colors.mutedForeground} />
            <Text style={{ fontSize: 13, color: colors.mutedForeground, fontWeight: '600' }}>फ़ोटो जोड़ें</Text>
          </View>
        )}
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>फ़ोटो कैसे लें?</Text>
        <View style={{ gap: 12, paddingBottom: 8 }}>
          <PrimaryButton label="कैमरा" icon="camera" onPress={() => pickFrom('camera')} />
          <TextButton label="गैलरी से चुनें" onPress={() => pickFrom('gallery')} />
        </View>
      </BottomSheet>
    </View>
  );
}

function PhotoPreview({ uri, circular }: { uri: string; circular?: boolean }) {
  const { Image } = require('expo-image');
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height: '100%', borderRadius: circular ? 999 : 12 }}
      contentFit="cover"
    />
  );
}

// ---------------------------------------------------------------------------
// Document picker sheet (camera / gallery / pdf) — used by document locker
// ---------------------------------------------------------------------------

export async function pickDocumentFile(): Promise<{
  uri: string;
  name: string;
  mimeType: string;
} | null> {
  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf' };
}

const styles = StyleSheet.create({
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    minHeight: Platform.select({ ios: 24, default: 44 }),
    paddingVertical: 0,
    includeFontPadding: false,
  },
  helperText: {
    fontSize: 13,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 52,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  photoBox: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoBoxCircular: {
    borderRadius: 60,
  },
  suggestBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  suggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
});
