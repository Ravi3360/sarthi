import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { useToast } from '@/context/ToastContext';
import { documentTypes, listDocuments, upsertDocument } from '@/services/documents';
import { pickDocumentFile } from '@/components/forms';
import { BottomSheet } from '@/components/BottomSheet';
import { Card, LoadingState, PrimaryButton, TextButton } from '@/components/ui';
import type { DocumentType, WorkerDocument } from '@/types/worker';

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const [docs, setDocs] = useState<WorkerDocument[]>([]);
  const [activeType, setActiveType] = useState<DocumentType | null>(null);
  const showToast = useToast();

  const load = useCallback(async () => {
    if (!worker) return;
    setDocs(await listDocuments(worker.uid));
  }, [worker]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handlePick = async (source: 'camera' | 'gallery' | 'pdf') => {
    if (!worker || !activeType) return;
    try {
      if (source === 'pdf') {
        const file = await pickDocumentFile();
        if (!file) return;
        await upsertDocument(worker.uid, { type: activeType, fileUri: file.uri, fileName: file.name, mimeType: file.mimeType });
      } else {
        const permission =
          source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) return;
        const result =
          source === 'camera'
            ? await ImagePicker.launchCameraAsync({ quality: 0.5 })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.5 });
        if (result.canceled || !result.assets[0]) return;
        const asset = result.assets[0];
        await upsertDocument(worker.uid, {
          type: activeType,
          fileUri: asset.uri,
          fileName: asset.fileName ?? `${activeType}.jpg`,
          mimeType: asset.mimeType ?? 'image/jpeg',
        });
      }
      showToast('दस्तावेज़ अपलोड हो गया');
      setActiveType(null);
      load();
    } catch (e) {
      showToast('अपलोड नहीं हो पाया', 'error');
    }
  };

  if (isLoading || !worker) return <LoadingState label={t('common.loading') ?? undefined} />;

  const uploadedCount = docs.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>{t('documents.title')}</Text>
        <Text style={{ color: colors.mutedForeground, marginTop: 4 }}>
          {t('documents.progress', { done: uploadedCount, total: documentTypes.length })}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10 }}>
        {documentTypes.map((type) => {
          const doc = docs.find((d) => d.type === type);
          return (
            <Card key={type} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: doc ? colors.successTint : colors.muted }]}>
                <Feather name={doc ? 'check-circle' : 'file'} size={20} color={doc ? colors.success : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.foreground }}>{t(`documents.${type}`)}</Text>
                <Text style={{ color: doc ? colors.success : colors.mutedForeground, fontSize: 13, marginTop: 2 }}>
                  {doc ? t('documents.uploaded') : t('documents.notUploaded')}
                </Text>
              </View>
              <TextButton label={doc ? t('common.edit') : t('common.upload')} onPress={() => setActiveType(type)} />
            </Card>
          );
        })}
      </ScrollView>

      <BottomSheet visible={!!activeType} onClose={() => setActiveType(null)}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{t('documents.uploadSheetTitle')}</Text>
        <View style={{ gap: 12, paddingBottom: 8 }}>
          <PrimaryButton label={t('documents.camera')} icon="camera" onPress={() => handlePick('camera')} />
          <PrimaryButton label={t('documents.gallery')} icon="image" onPress={() => handlePick('gallery')} />
          <PrimaryButton label={t('documents.pdfFile')} icon="file-text" onPress={() => handlePick('pdf')} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
});
