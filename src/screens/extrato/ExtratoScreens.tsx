import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Card,
  InfoRow,
  ScreenHeader,
  StateView,
  TextField,
  TransactionItem,
} from '../../components';
import { useApp } from '../../context/AppContext';
import type { AsyncStatus, Transaction } from '../../models';
import type { ExtratoProps } from '../../navigation/types';
import { statementService } from '../../services';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency, formatDateTime, maskCurrencyInput, parseCurrencyInput } from '../../utils/format';

export function ExtratoScreen({ navigation }: ExtratoProps<'ExtratoMain'>) {
  const { balanceHidden } = useApp();
  const [items, setItems] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [query, setQuery] = useState('');

  const load = useCallback(async (q?: string) => {
    try {
      setStatus('loading');
      const list = await statementService.list(q);
      setItems(list);
      setStatus(list.length ? 'success' : 'empty');
    } catch {
      setStatus('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(query);
    }, [load, query]),
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Extrato" />
      <View style={styles.searchWrap}>
        <TextInput
          placeholder="Buscar por nome ou descrição"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
        />
      </View>
      <StateView
        status={status}
        emptyMessage="Nenhuma movimentação encontrada."
        onRetry={() => load(query)}
      >
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              balanceHidden={balanceHidden}
              onPress={() =>
                navigation.navigate('TransactionDetail', { transactionId: item.id })
              }
            />
          )}
        />
      </StateView>
    </View>
  );
}

export function TransactionDetailScreen({
  navigation,
  route,
}: ExtratoProps<'TransactionDetail'>) {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setStatus('loading');
          const item = await statementService.getById(route.params.transactionId);
          setTx(item);
          setStatus(item.status === 'unavailable' ? 'unavailable' : 'success');
        } catch (e) {
          setStatus('error');
        }
      })();
    }, [route.params.transactionId]),
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Detalhe" onBack={() => navigation.goBack()} />
      <StateView status={status} onRetry={() => navigation.setParams({ transactionId: route.params.transactionId })}>
        {tx ? (
          <View style={styles.body}>
            <Card>
              <InfoRow label="Tipo" value={tx.type} />
              <InfoRow label="Status" value={tx.status} />
              <InfoRow label="Valor" value={formatCurrency(tx.amount)} large />
              <InfoRow label="Descrição" value={tx.description} />
              <InfoRow label="Contraparte" value={tx.counterpartName} />
              <InfoRow label="Data" value={formatDateTime(tx.createdAt)} />
              <InfoRow label="ID" value={tx.endToEndId} />
            </Card>
            <Button
              title="Ver comprovante"
              onPress={() => navigation.navigate('Receipt', { transactionId: tx.id })}
            />
            {tx.canRefund ? (
              <Button
                title="Solicitar devolução"
                variant="outline"
                style={{ marginTop: spacing.md }}
                onPress={() => navigation.navigate('Refund', { transactionId: tx.id })}
              />
            ) : null}
          </View>
        ) : null}
      </StateView>
    </View>
  );
}

export function ReceiptScreen({ navigation, route }: ExtratoProps<'Receipt'>) {
  const [tx, setTx] = useState<Transaction | null>(null);

  useFocusEffect(
    useCallback(() => {
      statementService.getById(route.params.transactionId).then(setTx);
    }, [route.params.transactionId]),
  );

  const share = async () => {
    if (!tx) return;
    await Share.share({
      message: `Comprovante Two-s (simulado)\n${tx.counterpartName}\n${formatCurrency(tx.amount)}\n${tx.endToEndId}`,
    });
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Comprovante" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.receiptTitle}>Two-s</Text>
        <Text style={styles.receiptSub}>Comprovante fictício</Text>
        {tx ? (
          <Card>
            <InfoRow label="Valor" value={formatCurrency(tx.amount)} large />
            <InfoRow label="Para" value={tx.counterpartName} />
            <InfoRow label="Quando" value={formatDateTime(tx.createdAt)} />
            <InfoRow label="Autenticação" value={tx.endToEndId} />
            <InfoRow label="Status" value={tx.status} />
          </Card>
        ) : null}
        <Button title="Compartilhar (simulado)" onPress={share} />
        <Button title="Concluir" variant="ghost" onPress={() => navigation.popToTop()} style={{ marginTop: spacing.md }} />
      </View>
    </View>
  );
}

const refundSchema = z.object({
  amount: z.number().positive('Informe o valor'),
});

export function RefundScreen({ navigation, route }: ExtratoProps<'Refund'>) {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [amountText, setAmountText] = useState('');

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<{ amount: number }>({
    resolver: zodResolver(refundSchema),
    defaultValues: { amount: 0 },
  });

  useFocusEffect(
    useCallback(() => {
      statementService.getById(route.params.transactionId).then((item) => {
        setTx(item);
        setAmountText(maskCurrencyInput(String(Math.round(item.amount * 100))));
        setValue('amount', item.amount);
      });
    }, [route.params.transactionId, setValue]),
  );

  const onSubmit = async (data: { amount: number }) => {
    if (!tx) return;
    setLoading(true);
    try {
      const refund = await statementService.refund(tx.id, data.amount);
      Alert.alert('Devolução realizada', 'Simulação concluída com sucesso.', [
        {
          text: 'Ver comprovante',
          onPress: () => navigation.replace('Receipt', { transactionId: refund.id }),
        },
      ]);
    } catch (e) {
      Alert.alert('Falha', e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Devolução" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.help}>
          Devolução total ou parcial simulada{tx ? ` (máx. ${formatCurrency(tx.amount)})` : ''}.
        </Text>
        <Controller
          control={control}
          name="amount"
          render={() => (
            <TextField
              label="Valor a devolver"
              value={amountText}
              onChangeText={(t) => {
                const masked = maskCurrencyInput(t);
                setAmountText(masked);
                setValue('amount', parseCurrencyInput(masked), { shouldValidate: true });
              }}
              keyboardType="number-pad"
              error={errors.amount?.message}
            />
          )}
        />
        <Button title="Devolver total" variant="outline" onPress={() => {
          if (!tx) return;
          const masked = maskCurrencyInput(String(Math.round(tx.amount * 100)));
          setAmountText(masked);
          setValue('amount', tx.amount, { shouldValidate: true });
        }} />
        <Button title="Confirmar devolução" onPress={handleSubmit(onSubmit)} loading={loading} style={{ marginTop: spacing.md }} />
        <Button title="Cancelar" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl },
  searchWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  search: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  receiptTitle: { ...typography.brand, textAlign: 'center' },
  receiptSub: { ...typography.caption, textAlign: 'center', marginBottom: spacing.xl },
  help: { ...typography.bodySecondary, marginBottom: spacing.lg },
});
