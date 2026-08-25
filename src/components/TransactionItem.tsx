import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Transaction } from '../models';
import { colors, radii, spacing, typography } from '../theme';
import { formatCurrency, formatDateTime } from '../utils/format';

const typeLabel: Record<string, string> = {
  pix_sent: 'Pix enviado',
  pix_received: 'Pix recebido',
  pix_refund: 'Devolução',
  boleto: 'Boleto',
  debit: 'Débito',
  credit: 'Crédito',
  scheduled: 'Agendado',
};

const statusColor: Record<string, string> = {
  completed: colors.success,
  pending: colors.pending,
  failed: colors.error,
  blocked: colors.warning,
  cancelled: colors.textMuted,
  unavailable: colors.warning,
};

interface Props {
  item: Transaction;
  onPress?: () => void;
  balanceHidden?: boolean;
}

export function TransactionItem({ item, onPress, balanceHidden }: Props) {
  const isOut = item.type === 'pix_sent' || item.type === 'boleto' || item.type === 'debit';
  const amountColor = isOut ? colors.text : colors.success;

  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons
          name={isOut ? 'arrow-up' : 'arrow-down'}
          size={18}
          color={colors.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.counterpartName}
        </Text>
        <Text style={styles.meta}>
          {typeLabel[item.type] ?? item.type} · {formatDateTime(item.createdAt)}
        </Text>
        {item.status !== 'completed' ? (
          <Text style={[styles.status, { color: statusColor[item.status] }]}>
            {item.status}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {balanceHidden
          ? 'R$ ••••'
          : `${isOut ? '−' : '+'} ${formatCurrency(item.amount)}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: { flex: 1 },
  name: { ...typography.h3, fontSize: 15 },
  meta: { ...typography.caption, marginTop: 2 },
  status: { ...typography.caption, marginTop: 2, textTransform: 'capitalize' },
  amount: { ...typography.amountSm, fontSize: 14 },
});
