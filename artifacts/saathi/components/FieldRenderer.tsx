import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { occupationGroups, occupations } from '@/constants/occupations';
import { stateDistricts } from '@/constants/districts';
import { getPath } from '@/utils/objectPath';
import { isValidIfsc } from '@/utils/validators';
import { uploadFile } from '@/services/storage';
import { IconTile } from '@/components/ui';
import {
  FieldInput,
  Stepper,
  ChipSelect,
  SelectField,
  DateField,
  ComboSelectField,
  BankSuggestField,
  PhotoPickerField,
} from '@/components/forms';
import type { FieldDescriptor } from '@/constants/onboardingSteps';
import type { WorkerProfile } from '@/types/worker';

/**
 * Renders one FieldDescriptor against a WorkerProfile draft. Shared by the
 * onboarding wizard and Profile edit sections so both stay in sync as field
 * types are added — previously each screen had its own (partially
 * duplicated) switch statement.
 */
export function FieldRenderer({
  field,
  draft,
  onChange,
  onGpsFill,
  gpsLocating,
}: {
  field: FieldDescriptor;
  draft: WorkerProfile;
  onChange: (key: string, value: unknown) => void;
  onGpsFill?: (addressKey: string, stateKey: string, districtKey: string) => void;
  gpsLocating?: boolean;
}) {
  const colors = useColors();

  if (field.type === 'locationFill') {
    return (
      <Pressable
        onPress={() => onGpsFill?.(field.addressKey, field.stateKey, field.districtKey)}
        disabled={gpsLocating}
        style={[styles.gpsButton, { borderColor: colors.primary, backgroundColor: colors.background }]}
      >
        {gpsLocating
          ? <ActivityIndicator size="small" color={colors.primary} />
          : <Feather name="map-pin" size={18} color={colors.primary} />}
        <Text style={{ fontSize: 15, color: colors.primary, fontWeight: '600', marginLeft: 8 }}>
          {gpsLocating ? 'लोकेशन मिल रही है…' : field.label}
        </Text>
      </Pressable>
    );
  }

  const value = getPath(draft, field.key);

  switch (field.type) {
    case 'text':
      if (field.key === 'bankName') {
        return (
          <BankSuggestField
            bankName={value === null || value === undefined ? '' : String(value)}
            onBankNameChange={(text) => onChange('bankName', text)}
            onIfscSelect={(bankName, ifsc) => {
              onChange('bankName', bankName);
              onChange('ifsc', ifsc);
            }}
          />
        );
      }
      return (
        <FieldInput
          label={field.label}
          value={value === null || value === undefined ? '' : String(value)}
          onChangeText={(text) => onChange(field.key, text)}
          keyboardType={field.keyboardType}
          maxLength={field.maxLength}
          prefix={field.prefix}
          autoCapitalize={field.autoCapitalize ?? 'none'}
          error={
            field.key === 'ifsc' && value
              ? isValidIfsc(String(value))
                ? null
                : 'सही IFSC कोड डालें (जैसे SBIN0001234)'
              : null
          }
        />
      );
    case 'chips':
      return (
        <ChipSelect
          label={field.label}
          options={field.options}
          multi={field.multi}
          value={field.multi ? (Array.isArray(value) ? value : []) : value ? [value] : []}
          onChange={(vals) => onChange(field.key, field.multi ? vals : vals[0] ?? null)}
        />
      );
    case 'stepper':
      return (
        <Stepper
          label={field.label}
          value={typeof value === 'number' ? value : 0}
          onChange={(v) => onChange(field.key, v)}
          min={field.min}
          max={field.max}
        />
      );
    case 'date':
      return <DateField label={field.label} value={value ?? null} onChange={(iso) => onChange(field.key, iso)} />;
    case 'select':
      return (
        <SelectField
          label={field.label}
          value={value ?? null}
          options={field.options}
          onChange={(v) => onChange(field.key, v)}
        />
      );
    case 'comboSelect': {
      const parentVal = field.parentKey ? String(getPath(draft, field.parentKey) ?? '') : '';
      const districtOpts = parentVal
        ? (stateDistricts[parentVal] ?? []).map((d) => ({ key: d, label: d }))
        : [];
      return (
        <ComboSelectField
          label={field.label}
          value={value ?? null}
          options={districtOpts}
          onChange={(v) => onChange(field.key, v)}
          disabled={!parentVal}
        />
      );
    }
    case 'photo':
      return (
        <PhotoPickerField
          label={field.label}
          value={value ?? null}
          onChange={(uri) => {
            // Show the picked photo immediately; swap in the real
            // Storage URL once the upload finishes in the background.
            onChange(field.key, uri);
            uploadFile(`workers/${draft.uid}/photo.jpg`, uri).then((url) => onChange(field.key, url));
          }}
          circular={field.circular}
        />
      );
    case 'occupationPicker':
      return (
        <View style={{ gap: 20 }}>
          {occupationGroups.map((group) => (
            <View key={group.key} style={{ gap: 10 }}>
              <View style={styles.grid}>
                {occupations
                  .filter((o) => o.groupKey === group.key)
                  .map((occ) => (
                    <View key={occ.key} style={styles.tileWrap}>
                      <IconTile
                        icon={occ.iconKey as any}
                        label={occ.labelHi}
                        selected={value === occ.key}
                        onPress={() => onChange(field.key, occ.key)}
                      />
                    </View>
                  ))}
              </View>
            </View>
          ))}
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tileWrap: {
    width: '31%',
  },
});
