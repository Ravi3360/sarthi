import React from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/context/ToastContext';

export function UPICard({ upiId, mobile, name }: { upiId: string; mobile: string; name?: string }) {
  const colors = useColors();
  const showToast = useToast();

  const handleCopyUPI = async () => {
    try {
      await Share.share({
        message: `My UPI ID: ${upiId}\nName: ${name || 'User'}`,
        title: 'Share UPI ID',
      });
      showToast('UPI ID shared!');
    } catch {
      showToast('Failed to share');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.primaryTint, borderColor: colors.primary }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Feather name="credit-card" size={28} color={colors.primaryDark} />
        <Text style={[styles.sectionTitle, { color: colors.primaryDark, flex: 1 }]}>Your UPI</Text>
      </View>

      <View style={styles.upiContainer}>
        {/* UPI ID Display */}
        <View style={[styles.upiBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Text style={{ color: colors.primaryDark, fontSize: 12, opacity: 0.7 }}>UPI ID</Text>
          <Text style={{ color: colors.primaryDark, fontWeight: '700', fontSize: 20, marginTop: 4 }}>
            {upiId}
          </Text>
        </View>

        {/* Details Row */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.detailBox, { backgroundColor: 'rgba(255,255,255,0.1)', flex: 1 }]}>
            <Text style={{ color: colors.primaryDark, fontSize: 12, opacity: 0.7 }}>Name</Text>
            <Text style={{ color: colors.primaryDark, fontWeight: '600', fontSize: 14, marginTop: 4 }}>
              {name || 'User'}
            </Text>
          </View>
          <View style={[styles.detailBox, { backgroundColor: 'rgba(255,255,255,0.1)', flex: 1 }]}>
            <Text style={{ color: colors.primaryDark, fontSize: 12, opacity: 0.7 }}>Mobile</Text>
            <Text style={{ color: colors.primaryDark, fontWeight: '600', fontSize: 14, marginTop: 4 }}>
              +91 {mobile}
            </Text>
          </View>
        </View>

        {/* Share Button */}
        <Pressable
          onPress={handleCopyUPI}
          style={[styles.shareBtn, { backgroundColor: colors.primaryDark }]}
        >
          <Feather name="share-2" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16, flex: 1, textAlign: 'center' }}>
            Share UPI ID
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  upiContainer: {
    gap: 16,
  },
  upiBox: {
    borderRadius: 12,
    padding: 16,
  },
  detailBox: {
    borderRadius: 12,
    padding: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
});
