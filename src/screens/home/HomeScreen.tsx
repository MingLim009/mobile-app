import React, { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuCard, StateView, TransactionItem } from '../../components';
import { useApp } from '../../context/AppContext';
import type { Account, AsyncStatus, Transaction } from '../../models';
import { accountService, authService, statementService } from '../../services';
import { colors, radii, spacing, typography } from '../../theme';
import { formatCurrency } from '../../utils/format';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, balanceHidden, toggleBalance, logout } = useApp();
  const [account, setAccount] = useState<Account | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const [acc, list] = await Promise.all([
        accountService.getAccount(),
        statementService.list(),
      ]);
      setAccount(acc);
      setTxs(list.slice(0, 5));
      setStatus(list.length ? 'success' : 'empty');
    } catch {
      setStatus('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.hello}>Olá,</Text>
            <Text style={styles.name}>{user?.name.split(' ')[0] ?? 'Cliente'}</Text>
          </View>
          <Pressable onPress={logout} hitSlop={8} accessibilityLabel="Sair">
            <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo disponível</Text>
            <Pressable onPress={toggleBalance} hitSlop={10}>
              <Ionicons
                name={balanceHidden ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={colors.white}
              />
            </Pressable>
          </View>
          <Text style={styles.balanceValue}>
            {balanceHidden || !account ? 'R$ ••••••' : formatCurrency(account.availableBalance)}
          </Text>
          <Text style={styles.accountMeta}>
            {account
              ? `${account.bankName} · Ag ${account.agency} · Cc ${account.accountNumber}`
              : '—'}
          </Text>
        </View>

        <Text style={styles.section}>Atalhos</Text>
        <MenuCard
          icon="flash-outline"
          title="Área Pix"
          subtitle="Transferir, cobrar e gerenciar"
          onPress={() => navigation.navigate('Pix')}
        />
        <MenuCard
          icon="finger-print"
          title="Biometria"
          subtitle="Ativar acesso biométrico (visual)"
          onPress={async () => {
            await authService.enableBiometrics();
            Alert.alert('Biometria', 'Ativada para o próximo login (simulado).');
          }}
        />

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Movimentações</Text>
          <Pressable onPress={() => navigation.navigate('Extrato')}>
            <Text style={styles.seeAll}>Ver extrato</Text>
          </Pressable>
        </View>

        <StateView status={status === 'loading' ? 'loading' : status === 'error' ? 'error' : 'success'} onRetry={load}>
          <View style={styles.list}>
            {txs.map((t) => (
              <TransactionItem
                key={t.id}
                item={t}
                balanceHidden={balanceHidden}
                onPress={() =>
                  navigation.navigate('Extrato', {
                    screen: 'TransactionDetail',
                    params: { transactionId: t.id },
                  })
                }
              />
            ))}
          </View>
        </StateView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  hello: { ...typography.bodySecondary },
  name: { ...typography.h1 },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  balanceValue: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  accountMeta: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: spacing.sm },
  section: { ...typography.h3, marginBottom: spacing.md, marginTop: spacing.sm },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  seeAll: { color: colors.primary, fontWeight: '600' },
  list: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
