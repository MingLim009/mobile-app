import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  InfoRow,
  MenuCard,
  ScreenHeader,
  StateView,
  TextField,
  TransactionItem,
} from '../../components';
import type { AsyncStatus, MedCase, Transaction } from '../../models';
import type { SupportProps } from '../../navigation/types';
import { medService, statementService } from '../../services';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { medSchema, type MedForm } from '../../validation/schemas';

export function SupportHomeScreen({ navigation }: SupportProps<'SupportHome'>) {
  return (
    <View style={styles.flex}>
      <ScreenHeader title="Suporte" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>
          Central de ajuda fictícia. Use para simular contestação MED e consultar protocolos.
        </Text>
        <MenuCard
          icon="shield-checkmark-outline"
          title="Contestação MED"
          subtitle="Mecanismo Especial de Devolução"
          onPress={() => navigation.navigate('MedIntro')}
        />
        <MenuCard
          icon="list-outline"
          title="Minhas contestações"
          subtitle="Acompanhar andamento"
          onPress={() => navigation.navigate('MedList')}
        />
        <MenuCard
          icon="chatbubble-ellipses-outline"
          title="Falar com atendimento"
          subtitle="Simulação — sem chat real"
          onPress={() => Alert.alert('Atendimento', 'Canal simulado. Nenhuma mensagem é enviada.')}
        />
      </ScrollView>
    </View>
  );
}

export function MedIntroScreen({ navigation }: SupportProps<'MedIntro'>) {
  return (
    <View style={styles.flex}>
      <ScreenHeader title="MED" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.title}>O que é o MED?</Text>
        <Text style={styles.intro}>
          O Mecanismo Especial de Devolução permite contestar transações Pix em casos de fraude
          ou engano. Nesta etapa, todo o fluxo é apenas visual e usa dados fictícios.
        </Text>
        <Button title="Iniciar contestação" onPress={() => navigation.navigate('MedSelectTx')} />
        <Button
          title="Ver contestações existentes"
          variant="outline"
          style={{ marginTop: spacing.md }}
          onPress={() => navigation.navigate('MedList')}
        />
      </ScrollView>
    </View>
  );
}

export function MedSelectTxScreen({ navigation }: SupportProps<'MedSelectTx'>) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setStatus('loading');
          const list = await statementService.list();
          const eligible = list.filter((t) => t.type === 'pix_sent' || t.type === 'boleto');
          setItems(eligible);
          setStatus(eligible.length ? 'success' : 'empty');
        } catch {
          setStatus('error');
        }
      })();
    }, []),
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Selecionar transação" onBack={() => navigation.goBack()} />
      <StateView status={status} emptyMessage="Não há transações elegíveis.">
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              onPress={() => navigation.navigate('MedForm', { transactionId: item.id })}
            />
          )}
        />
      </StateView>
    </View>
  );
}

export function MedFormScreen({ navigation, route }: SupportProps<'MedForm'>) {
  const [loading, setLoading] = useState(false);
  const [docAttached, setDocAttached] = useState(false);
  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<MedForm>({
    resolver: zodResolver(medSchema),
    defaultValues: { reason: '', description: '' },
  });
  const reason = watch('reason');

  const onSubmit = async (data: MedForm) => {
    setLoading(true);
    try {
      const created = await medService.create({
        transactionId: route.params.transactionId,
        reason: data.reason,
        description: data.description,
      });
      navigation.replace('MedResult', { protocol: created.protocol, caseId: created.id });
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Abrir MED" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.label}>Motivo</Text>
        {medService.reasons.map((r) => (
          <Button
            key={r}
            title={r}
            variant={reason === r ? 'primary' : 'outline'}
            style={{ marginBottom: spacing.sm }}
            onPress={() => setValue('reason', r, { shouldValidate: true })}
          />
        ))}
        {errors.reason ? <Text style={styles.error}>{errors.reason.message}</Text> : null}

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Descrição"
              value={value}
              onChangeText={onChange}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
              error={errors.description?.message}
            />
          )}
        />

        <Button
          title={docAttached ? 'Documento anexado (simulado)' : 'Anexar documento (simulado)'}
          variant="outline"
          onPress={() => setDocAttached(true)}
        />

        <Button
          title="Enviar contestação"
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          style={{ marginTop: spacing.lg }}
        />
        <Button title="Cancelar" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </View>
  );
}

export function MedResultScreen({ navigation, route }: SupportProps<'MedResult'>) {
  return (
    <View style={styles.flex}>
      <ScreenHeader title="Protocolo" onBack={() => navigation.popToTop()} />
      <View style={styles.body}>
        <Text style={styles.title}>Contestação registrada</Text>
        <Card>
          <InfoRow label="Protocolo" value={route.params.protocol} />
          <InfoRow label="Status" value="Aberta" />
        </Card>
        <Button
          title="Acompanhar"
          onPress={() => navigation.replace('MedDetail', { caseId: route.params.caseId })}
        />
        <Button title="Voltar ao suporte" variant="ghost" onPress={() => navigation.popToTop()} style={{ marginTop: spacing.md }} />
      </View>
    </View>
  );
}

export function MedListScreen({ navigation }: SupportProps<'MedList'>) {
  const [items, setItems] = useState<MedCase[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setStatus('loading');
          const list = await medService.list();
          setItems(list);
          setStatus(list.length ? 'success' : 'empty');
        } catch {
          setStatus('error');
        }
      })();
    }, []),
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Contestações" onBack={() => navigation.goBack()} />
      <StateView status={status}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.body}
          renderItem={({ item }) => (
            <MenuCard
              icon="document-text-outline"
              title={item.protocol}
              subtitle={`${item.status} · ${formatCurrency(item.amount)}`}
              onPress={() => navigation.navigate('MedDetail', { caseId: item.id })}
            />
          )}
        />
      </StateView>
    </View>
  );
}

export function MedDetailScreen({ navigation, route }: SupportProps<'MedDetail'>) {
  const [item, setItem] = useState<MedCase | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setStatus('loading');
          setItem(await medService.getById(route.params.caseId));
          setStatus('success');
        } catch {
          setStatus('error');
        }
      })();
    }, [route.params.caseId]),
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Andamento MED" onBack={() => navigation.goBack()} />
      <StateView status={status}>
        {item ? (
          <View style={styles.body}>
            <Card>
              <InfoRow label="Protocolo" value={item.protocol} />
              <InfoRow label="Status" value={item.status} />
              <InfoRow label="Motivo" value={item.reason} />
              <InfoRow label="Descrição" value={item.description} />
              <InfoRow label="Transação" value={item.transactionSummary} />
              <InfoRow label="Valor" value={formatCurrency(item.amount)} />
              <InfoRow label="Abertura" value={formatDateTime(item.createdAt)} />
              <InfoRow label="Atualização" value={formatDateTime(item.updatedAt)} />
            </Card>
          </View>
        ) : null}
      </StateView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl },
  intro: { ...typography.bodySecondary, marginBottom: spacing.xl },
  title: { ...typography.h2, marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.sm },
  error: { color: colors.error, marginBottom: spacing.md },
});
