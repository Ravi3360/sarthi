import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useWorker } from '@/context/WorkerContext';
import { useToast } from '@/context/ToastContext';
import { addIncome, listIncome } from '@/services/income';
import { addWorkHistory, listWorkHistory } from '@/services/workHistory';
import { formatCurrency, formatDateHi, durationBetween } from '@/utils/format';
import { BottomSheet } from '@/components/BottomSheet';
import { FieldInput, ChipSelect, DateField } from '@/components/forms';
import { Card, Chip, EmptyState, LoadingState, PrimaryButton } from '@/components/ui';
import type { IncomeEntry, WorkHistoryEntry } from '@/types/worker';

type Tab = 'income' | 'history';

export default function IncomeScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { worker, isLoading } = useWorker();
  const [tab, setTab] = useState<Tab>('income');
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [history, setHistory] = useState<WorkHistoryEntry[]>([]);
  const [sheet, setSheet] = useState<'income' | 'history' | null>(null);
  const showToast = useToast();

  const load = useCallback(async () => {
    if (!worker) return;
    const [incomeList, historyList] = await Promise.all([listIncome(worker.uid), listWorkHistory(worker.uid)]);
    setIncome(incomeList);
    setHistory(historyList);
  }, [worker]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const totals = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    let today = 0,
      week = 0,
      month = 0,
      pending = 0;
    for (const entry of income) {
      const d = new Date(entry.date);
      if (d.toDateString() === now.toDateString()) today += entry.amount;
      if (d >= startOfWeek) week += entry.amount;
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) month += entry.amount;
      if (entry.status === 'pending') pending += entry.amount;
    }
    return { today, week, month, pending };
  }, [income]);

  const monthlyChart = useMemo(() => {
    const buckets: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const total = income
        .filter((e) => {
          const ed = new Date(e.date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        })
        .reduce((sum, e) => sum + e.amount, 0);
      buckets.push({ label: d.toLocaleDateString('hi-IN', { month: 'short' }), value: total });
    }
    return buckets;
  }, [income]);

  const totalExperience = useMemo(() => {
    let totalMonths = 0;
    for (const h of history) {
      const { years, months } = durationBetween(h.startDate, h.endDate);
      totalMonths += years * 12 + months;
    }
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
  }, [history]);

  if (isLoading || !worker) return <LoadingState label={t('common.loading') ?? undefined} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip label={t('income.sectionIncome')} selected={tab === 'income'} onPress={() => setTab('income')} />
          <Chip label={t('income.sectionHistory')} selected={tab === 'history'} onPress={() => setTab('history')} />
        </View>
      </View>

      {tab === 'income' ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 16 }}>
          <View style={styles.statGrid}>
            <StatCard label={t('income.todayTotal')} value={formatCurrency(totals.today)} />
            <StatCard label={t('income.weekTotal')} value={formatCurrency(totals.week)} />
            <StatCard label={t('income.monthTotal')} value={formatCurrency(totals.month)} highlight />
            <StatCard label={t('income.pendingSalary')} value={formatCurrency(totals.pending)} tone="warning" />
          </View>

          <Card>
            <Text style={{ fontWeight: '700', color: colors.foreground, marginBottom: 12 }}>{t('income.monthlyChart')}</Text>
            <BarChart data={monthlyChart} />
          </Card>

          <PrimaryButton label={t('income.addIncome')} icon="plus" onPress={() => setSheet('income')} />

          {income.length === 0 ? (
            <EmptyState icon="dollar-sign" title={t('income.emptyTitle')} subtitle={t('income.emptySubtitle') ?? undefined} />
          ) : (
            <View style={{ gap: 10 }}>
              {income.map((entry) => (
                <Card key={entry.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.primaryTint }]}>
                    <Feather name={entry.mode === 'upi' ? 'smartphone' : 'dollar-sign'} size={18} color={colors.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.foreground }}>{formatCurrency(entry.amount)}</Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                      {entry.sourceName || (entry.source === 'employer' ? t('income.employer') : t('income.contractor'))} · {formatDateHi(entry.date)}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140, gap: 16 }}>
          <Card style={{ backgroundColor: colors.primaryTint, borderColor: colors.primaryTint }}>
            <Text style={{ color: colors.primaryDark, fontWeight: '600' }}>{t('workHistory.totalExperience')}</Text>
            <Text style={{ color: colors.primaryDark, fontSize: 22, fontWeight: '800', marginTop: 4 }}>
              {t('workHistory.years', { count: totalExperience.years })} {t('workHistory.months', { count: totalExperience.months })}
            </Text>
          </Card>

          <PrimaryButton label={t('workHistory.add')} icon="plus" onPress={() => setSheet('history')} />

          {history.length === 0 ? (
            <EmptyState icon="briefcase" title={t('workHistory.emptyTitle')} subtitle={t('workHistory.emptySubtitle') ?? undefined} />
          ) : (
            <View style={{ gap: 10 }}>
              {history.map((entry) => (
                <Card key={entry.id}>
                  <Text style={{ fontWeight: '700', color: colors.foreground }}>{entry.role}</Text>
                  <Text style={{ color: colors.mutedForeground, marginTop: 2 }}>{entry.employer} · {entry.location}</Text>
                  <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 6 }}>{formatCurrency(entry.salary)}/महीना</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                    {formatDateHi(entry.startDate)} — {entry.endDate ? formatDateHi(entry.endDate) : 'अभी तक'}
                  </Text>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <IncomeSheet
        visible={sheet === 'income'}
        onClose={() => setSheet(null)}
        onSubmit={async (input) => {
          if (!worker) return;
          await addIncome(worker.uid, input);
          showToast('कमाई जोड़ी गई');
          setSheet(null);
          load();
        }}
      />
      <WorkHistorySheet
        visible={sheet === 'history'}
        onClose={() => setSheet(null)}
        onSubmit={async (input) => {
          if (!worker) return;
          await addWorkHistory(worker.uid, input);
          showToast('अनुभव जोड़ा गया');
          setSheet(null);
          load();
        }}
      />
    </View>
  );
}

function StatCard({ label, value, tone, highlight }: { label: string; value: string; tone?: 'warning'; highlight?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: highlight ? colors.primaryTint : tone === 'warning' ? colors.warningTint : colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <Text
        style={{
          color: highlight ? colors.primaryDark : tone === 'warning' ? colors.warning : colors.foreground,
          fontSize: 18,
          fontWeight: '800',
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const colors = useColors();
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: '70%',
              height: Math.max((d.value / max) * 88, 4),
              backgroundColor: colors.primary,
              borderRadius: 6,
            }}
          />
          <Text style={{ fontSize: 10, color: colors.mutedForeground }}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

function IncomeSheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<IncomeEntry, 'id'>) => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'cash' | 'upi'>('cash');
  const [source, setSource] = useState<'employer' | 'contractor'>('employer');
  const [sourceName, setSourceName] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString());

  const submit = () => {
    const numeric = Number(amount);
    if (!numeric || numeric <= 0 || !sourceName) return;
    onSubmit({ amount: numeric, mode, source, sourceName, date, status: 'received' });
    setAmount('');
    setSourceName('');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{t('income.addIncome')}</Text>
        <FieldInput label={t('income.amount')} value={amount} onChangeText={setAmount} keyboardType="numeric" prefix="₹" />
        <ChipSelect
          label={t('income.mode')}
          options={[{ key: 'cash', label: t('income.cash') }, { key: 'upi', label: t('income.upi') }]}
          value={[mode]}
          onChange={(v) => setMode((v[0] as 'cash' | 'upi') ?? 'cash')}
        />
        <ChipSelect
          label={t('income.source')}
          options={[{ key: 'employer', label: t('income.employer') }, { key: 'contractor', label: t('income.contractor') }]}
          value={[source]}
          onChange={(v) => setSource((v[0] as 'employer' | 'contractor') ?? 'employer')}
        />
        <FieldInput label={t('income.sourceName')} value={sourceName} onChangeText={setSourceName} autoCapitalize="words" />
        <DateField label={t('income.date')} value={date} onChange={setDate} />
        <PrimaryButton label={t('common.save')} onPress={submit} disabled={!amount || !sourceName} />
      </ScrollView>
    </BottomSheet>
  );
}

function WorkHistorySheet({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: Omit<WorkHistoryEntry, 'id'>) => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const [employer, setEmployer] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString());
  const [reasonForLeaving, setReasonForLeaving] = useState('');
  const [reference, setReference] = useState('');

  const submit = () => {
    if (!employer || !role || !salary) return;
    onSubmit({
      employer,
      role,
      location,
      salary: Number(salary) || 0,
      startDate,
      endDate: null,
      reasonForLeaving,
      reference,
    });
    setEmployer('');
    setRole('');
    setLocation('');
    setSalary('');
    setReasonForLeaving('');
    setReference('');
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 16 }}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{t('workHistory.add')}</Text>
        <FieldInput label={t('workHistory.employer')} value={employer} onChangeText={setEmployer} autoCapitalize="words" />
        <FieldInput label={t('workHistory.role')} value={role} onChangeText={setRole} autoCapitalize="words" />
        <FieldInput label={t('workHistory.location')} value={location} onChangeText={setLocation} autoCapitalize="words" />
        <FieldInput label={t('workHistory.salary')} value={salary} onChangeText={setSalary} keyboardType="numeric" prefix="₹" />
        <DateField label={t('workHistory.startDate')} value={startDate} onChange={setStartDate} />
        <FieldInput label={t('workHistory.reasonForLeaving')} value={reasonForLeaving} onChangeText={setReasonForLeaving} />
        <FieldInput label={t('workHistory.reference')} value={reference} onChangeText={setReference} />
        <PrimaryButton label={t('common.save')} onPress={submit} disabled={!employer || !role || !salary} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', borderRadius: 14, borderWidth: 1, padding: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '700' },
});
