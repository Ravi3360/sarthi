import { useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { stateDistricts } from '@/constants/districts';
import { setPath } from '@/utils/objectPath';
import type { WorkerProfile } from '@/types/worker';

/** English region name → Hindi state name mapping for GPS reverse-geocode */
const EN_TO_HI_STATE: Record<string, string> = {
  'Andhra Pradesh': 'आंध्र प्रदेश', 'Arunachal Pradesh': 'अरुणाचल प्रदेश', 'Assam': 'असम',
  'Bihar': 'बिहार', 'Chhattisgarh': 'छत्तीसगढ़', 'Goa': 'गोवा', 'Gujarat': 'गुजरात',
  'Haryana': 'हरियाणा', 'Himachal Pradesh': 'हिमाचल प्रदेश', 'Jharkhand': 'झारखंड',
  'Karnataka': 'कर्नाटक', 'Kerala': 'केरल', 'Madhya Pradesh': 'मध्य प्रदेश',
  'Maharashtra': 'महाराष्ट्र', 'Manipur': 'मणिपुर', 'Meghalaya': 'मेघालय',
  'Mizoram': 'मिज़ोरम', 'Nagaland': 'नागालैंड', 'Odisha': 'ओडिशा', 'Punjab': 'पंजाब',
  'Rajasthan': 'राजस्थान', 'Sikkim': 'सिक्किम', 'Tamil Nadu': 'तमिलनाडु',
  'Telangana': 'तेलंगाना', 'Tripura': 'त्रिपुरा', 'Uttar Pradesh': 'उत्तर प्रदेश',
  'Uttarakhand': 'उत्तराखंड', 'West Bengal': 'पश्चिम बंगाल', 'Delhi': 'दिल्ली',
  'Jammu and Kashmir': 'जम्मू और कश्मीर', 'Ladakh': 'लद्दाख',
};

/**
 * Shared GPS → address/state/district autofill, used by both the onboarding
 * wizard and Profile edit's "personal" section (both let a worker fill an
 * address via GPS instead of typing it).
 */
export function useGpsAddressFill(setDraft: React.Dispatch<React.SetStateAction<WorkerProfile | null>>) {
  const [locating, setLocating] = useState(false);

  const fillFromGps = async (addressKey: string, stateKey: string, districtKey: string) => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('अनुमति नहीं मिली', 'लोकेशन इस्तेमाल करने के लिए अनुमति दें।');
        return;
      }
      // Try cached location first (instant), fall back to fresh low-accuracy fix
      let pos = await Location.getLastKnownPositionAsync();
      if (!pos) pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (!geo) return;
      const parts = [geo.street, geo.district || geo.subregion, geo.city].filter(Boolean);
      const addressStr = parts.join(', ') + (geo.postalCode ? ' - ' + geo.postalCode : '');
      const hindiState = geo.region ? EN_TO_HI_STATE[geo.region] ?? '' : '';
      // Try to match district from Hindi district list
      const districtList = hindiState ? (stateDistricts[hindiState] ?? []) : [];
      const detectedEn = geo.district || geo.subregion || '';
      const matchedDistrict = districtList.find(
        (d) => d.toLowerCase().includes(detectedEn.toLowerCase()) || detectedEn.toLowerCase().includes(d.toLowerCase())
      ) ?? '';
      setDraft((prev) => {
        if (!prev) return prev;
        let next = setPath(prev, addressKey, addressStr);
        if (hindiState) next = setPath(next, stateKey, hindiState);
        if (matchedDistrict) next = setPath(next, districtKey, matchedDistrict);
        return next;
      });
    } catch {
      Alert.alert('त्रुटि', 'लोकेशन नहीं मिली। कृपया दोबारा कोशिश करें।');
    } finally {
      setLocating(false);
    }
  };

  return { fillFromGps, locating };
}
