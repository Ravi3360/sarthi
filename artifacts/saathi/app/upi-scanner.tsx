import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, Modal, ScrollView, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/context/ToastContext';
import { PrimaryButton, SecondaryButton } from '@/components/ui';

interface UPIData {
  upiId?: string;
  name?: string;
  amount?: string;
  description?: string;
  transactionRef?: string;
}

function UPIScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const [upiCode, setUpiCode] = useState('');
  const [upiData, setUpiData] = useState<UPIData | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const parseUPIString = (data: string): UPIData | null => {
    try {
      // UPI format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=DESCRIPTION&tr=TXN_REF
      const url = new URL(data);
      if (url.protocol !== 'upi:') return null;

      const params = new URLSearchParams(url.search);
      return {
        upiId: params.get('pa') || undefined,
        name: params.get('pn') || undefined,
        amount: params.get('am') || undefined,
        description: params.get('tn') || undefined,
        transactionRef: params.get('tr') || undefined,
      };
    } catch {
      return null;
    }
  };

  const handleScanUPI = () => {
    if (!upiCode.trim()) {
      showToast('Please enter UPI code');
      return;
    }

    const parsed = parseUPIString(upiCode);
    if (parsed && parsed.upiId) {
      setUpiData(parsed);
      setShowConfirm(true);
    } else {
      showToast('Invalid UPI code format');
    }
  };

  const handleConfirmPayment = () => {
    if (upiData?.upiId) {
      showToast(`Payment initiated to ${upiData.name || upiData.upiId}`);
      setShowConfirm(false);
      setUpiData(null);
      setUpiCode('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={28} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, flex: 1 }}>Receive Payment</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginBottom: 12 }}>
            Paste UPI Code
          </Text>
          <TextInput
            placeholder="Paste UPI code here or enter manually"
            placeholderTextColor={colors.mutedForeground}
            value={upiCode}
            onChangeText={setUpiCode}
            style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            multiline
          />
          <PrimaryButton label="Parse UPI Code" onPress={handleScanUPI} />
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.primaryTint, borderColor: colors.primary }]}>
          <Feather name="info" size={24} color={colors.primaryDark} style={{ marginBottom: 8 }} />
          <Text style={{ color: colors.primaryDark, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            UPI Code Format
          </Text>
          <Text style={{ color: colors.primaryDark, fontSize: 12, opacity: 0.8, lineHeight: 18 }}>
            upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=NOTE
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Pressable onPress={() => setShowConfirm(false)} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>

            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Payment Details</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {upiData?.name && (
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: colors.mutedForeground }}>Receiver Name</Text>
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>{upiData.name}</Text>
                </View>
              )}

              {upiData?.upiId && (
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: colors.mutedForeground }}>UPI ID</Text>
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>{upiData.upiId}</Text>
                </View>
              )}

              {upiData?.amount && (
                <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.border, borderBottomColor: colors.border, paddingTop: 12, marginTop: 12 }]}>
                  <Text style={{ color: colors.mutedForeground }}>Amount</Text>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 20 }}>₹{upiData.amount}</Text>
                </View>
              )}

              {upiData?.description && (
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={{ color: colors.mutedForeground }}>Note</Text>
                  <Text style={{ color: colors.foreground, fontSize: 14 }}>{upiData.description}</Text>
                </View>
              )}
            </ScrollView>

            <View style={{ gap: 12, marginTop: 20 }}>
              <PrimaryButton label="Confirm Payment" onPress={handleConfirmPayment} />
              <SecondaryButton label="Cancel" onPress={() => setShowConfirm(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default UPIScannerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    alignItems: 'flex-start',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  detailRow: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
});
