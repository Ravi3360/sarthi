import React, { useEffect, useState } from 'react';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Pressable, StyleSheet, Text, View, Modal, ScrollView } from 'react-native';
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

export default function UPIScannerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const showToast = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [upiData, setUpiData] = useState<UPIData | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

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

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    const parsed = parseUPIString(data);

    if (parsed && parsed.upiId) {
      setUpiData(parsed);
      setShowConfirm(true);
    } else {
      showToast('Invalid UPI QR code');
      setTimeout(() => setScanned(false), 1000);
    }
  };

  const handleConfirmPayment = () => {
    if (upiData?.upiId) {
      showToast(`Payment initiated to ${upiData.name || upiData.upiId}`);
      setShowConfirm(false);
      setUpiData(null);
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={{ color: colors.foreground }}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={{ color: colors.foreground, marginBottom: 16, textAlign: 'center' }}>
          Camera permission is required to scan UPI QR codes
        </Text>
        <SecondaryButton label="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={28} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, flex: 1 }}>UPI Scanner</Text>
      </View>

      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Scanner overlay */}
      <View style={styles.overlay}>
        <View style={styles.focusArea} />
        <Text style={{ color: '#FFFFFF', fontSize: 16, marginTop: 16, textAlign: 'center' }}>
          Point camera at UPI QR code
        </Text>
      </View>

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
                <View style={styles.detailRow}>
                  <Text style={{ color: colors.mutedForeground }}>Receiver Name</Text>
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>{upiData.name}</Text>
                </View>
              )}

              {upiData?.upiId && (
                <View style={styles.detailRow}>
                  <Text style={{ color: colors.mutedForeground }}>UPI ID</Text>
                  <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>{upiData.upiId}</Text>
                </View>
              )}

              {upiData?.amount && (
                <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 }]}>
                  <Text style={{ color: colors.mutedForeground }}>Amount</Text>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 20 }}>₹{upiData.amount}</Text>
                </View>
              )}

              {upiData?.description && (
                <View style={styles.detailRow}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  focusArea: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: '#00D4FF',
    borderRadius: 20,
    shadowColor: '#00D4FF',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
});
