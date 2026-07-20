import React, { useMemo } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import QRCode from 'qrcode.react';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/context/ToastContext';

export function UPICard({ upiId, mobile, name }: { upiId: string; mobile: string; name?: string }) {
  const colors = useColors();
  const showToast = useToast();

  const qrData = useMemo(() => {
    // UPI format: upi://pay?pa=UPI_ID&pn=NAME&tn=NOTE
    const encodedName = encodeURIComponent(name || mobile);
    return `upi://pay?pa=${upiId}&pn=${encodedName}`;
  }, [upiId, name, mobile]);

  const handleCopyUPI = async () => {
    try {
      await Share.share({
        message: `My UPI ID: ${upiId}`,
        title: 'Share UPI ID',
      });
      showToast('UPI ID copied!');
    } catch {
      showToast('Failed to copy');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>UPI Payment</Text>

      <View style={styles.upiContainer}>
        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={[styles.qrBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <QRCode
              value={qrData}
              size={180}
              level="H"
              includeMargin={true}
              color={colors.foreground}
              backgroundColor={colors.background}
            />
          </View>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' }}>
            Scan to receive payment
          </Text>
        </View>

        {/* UPI Details Section */}
        <View style={styles.detailsSection}>
          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>UPI ID</Text>
            <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>{upiId}</Text>
          </View>

          <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
            <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>Mobile</Text>
            <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 16 }}>+91 {mobile}</Text>
          </View>

          <Pressable
            onPress={handleCopyUPI}
            style={[styles.copyBtn, { backgroundColor: colors.primaryTint }]}
          >
            <Feather name="copy" size={18} color={colors.primaryDark} />
            <Text style={{ color: colors.primaryDark, fontWeight: '600', fontSize: 14 }}>Share UPI ID</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  upiContainer: {
    gap: 20,
  },
  qrSection: {
    alignItems: 'center',
  },
  qrBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
});
