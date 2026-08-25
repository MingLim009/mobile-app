import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Button,
  ScreenHeader,
  StateView,
  TextField,
} from '../../components';
import type { AsyncStatus, Contact, PixKeyType, TransferDraft } from '../../models';
import type { PixProps } from '../../navigation/types';
import { contactService, pixService } from '../../services';
import { colors, radii, spacing, typography } from '../../theme';
import {
  formatAccount,
  formatAgency,
  formatCnpj,
  formatCpf,
  formatPhone,
  maskCurrencyInput,
  parseCurrencyInput,
} from '../../utils/format';

export function TransferByKeyScreen({ navigation, route }: PixProps<'TransferByKey'>) {
  const keyType = (route.params?.keyType ?? 'cpf') as PixKeyType;
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useFocusEffect(
    useCallback(() => {
      contactService.list().then((list) =>
        setContacts(list.filter((c) => c.recent || c.favorite)),
      );
    }, []),
  );

  const mask = (t: string) => {
    if (keyType === 'cpf') return formatCpf(t);
    if (keyType === 'cnpj') return formatCnpj(t);
    if (keyType === 'phone') return formatPhone(t);
    return t;
  };

  const continueWith = async (keyValue: string, name?: string, contactId?: string) => {
    setLoading(true);
    try {
      const resolved = await pixService.resolveKey(keyType, keyValue);
      const draft: TransferDraft = {
        method: 'key',
        keyType,
        keyValue,
        counterpartName: name ?? resolved.name,
        contactId,
        amount: 0,
      };
      navigation.navigate('TransferAmount', { draft });
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title={`Pix · ${keyType.toUpperCase()}`} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <TextField
          label="Chave"
          value={value}
          onChangeText={(t) => setValue(mask(t))}
          autoCapitalize="none"
          keyboardType={keyType === 'email' || keyType === 'random' ? 'default' : 'number-pad'}
        />
        <Button title="Continuar" onPress={() => continueWith(value)} loading={loading} disabled={!value.trim()} />

        <Text style={styles.section}>Favoritos e recentes</Text>
        {contacts.map((c) => (
          <Pressable
            key={c.id}
            style={styles.contact}
            onPress={() => continueWith(c.pixKey ?? '', c.name, c.id)}
          >
            <Text style={styles.contactName}>{c.name}</Text>
            <Text style={styles.contactMeta}>
              {c.favorite ? '★ ' : ''}
              {c.pixKeyType} · {c.pixKey}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function TransferManualScreen({ navigation }: PixProps<'TransferManual'>) {
  const [bankCode, setBankCode] = useState('001');
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [document, setDocument] = useState('');

  const next = () => {
    if (!agency || !accountNumber || !document) {
      Alert.alert('Campos obrigatórios', 'Preencha banco, agência, conta e CPF/CNPJ.');
      return;
    }
    const draft: TransferDraft = {
      method: 'manual',
      bankCode,
      agency,
      accountNumber,
      document,
      counterpartName: 'Titular da conta (simulado)',
      amount: 0,
    };
    navigation.navigate('TransferAmount', { draft });
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Agência e conta" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <TextField label="Código do banco" value={bankCode} onChangeText={setBankCode} keyboardType="number-pad" />
        <TextField label="Agência" value={agency} onChangeText={(t) => setAgency(formatAgency(t))} keyboardType="number-pad" />
        <TextField label="Conta" value={accountNumber} onChangeText={(t) => setAccountNumber(formatAccount(t))} keyboardType="number-pad" />
        <TextField
          label="CPF/CNPJ do titular"
          value={document}
          onChangeText={(t) => setDocument(t.replace(/\D/g, '').length > 11 ? formatCnpj(t) : formatCpf(t))}
          keyboardType="number-pad"
        />
        <Button title="Continuar" onPress={next} />
      </ScrollView>
    </View>
  );
}

export function CopyPasteScreen({ navigation }: PixProps<'CopyPaste'>) {
  const [payload, setPayload] = useState('');
  const [loading, setLoading] = useState(false);

  const parse = async () => {
    setLoading(true);
    try {
      const draft = await pixService.parseCopyPaste(payload);
      navigation.navigate('TransferAmount', { draft });
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Copia e Cola" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <TextField
          label="Código Pix"
          value={payload}
          onChangeText={setPayload}
          multiline
          style={{ minHeight: 120, textAlignVertical: 'top' }}
          hint="Cole qualquer texto para simular a leitura"
        />
        <Button title="Continuar" onPress={parse} loading={loading} disabled={!payload.trim()} />
      </View>
    </View>
  );
}

export function QrScanScreen({ navigation }: PixProps<'QrScan'>) {
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const draft = await pixService.parseQr();
      navigation.navigate('TransferAmount', { draft });
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="QR Code" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <View style={styles.scanner}>
          <Text style={styles.scannerText}>Área de leitura (simulada)</Text>
        </View>
        <Text style={styles.help}>
          A câmera real não é obrigatória nesta etapa. Toque para simular a leitura de um QR.
        </Text>
        <Button title="Simular leitura" onPress={simulate} loading={loading} />
        <Button title="Cancelar" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }} />
      </View>
    </View>
  );
}

export function TransferAmountScreen({ navigation, route }: PixProps<'TransferAmount'>) {
  const draft = route.params.draft;
  const [amountText, setAmountText] = useState(
    draft.amount > 0 ? maskCurrencyInput(String(Math.round(draft.amount * 100))) : '',
  );
  const [description, setDescription] = useState(draft.description ?? '');
  const [scheduledDate, setScheduledDate] = useState(draft.scheduledDate ?? '');

  const next = () => {
    const amount = parseCurrencyInput(amountText);
    if (amount <= 0) {
      Alert.alert('Valor', 'Informe um valor maior que zero.');
      return;
    }
    navigation.navigate('TransferConfirm', {
      draft: { ...draft, amount, description, scheduledDate: scheduledDate || undefined },
    });
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Valor" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.to}>Para: {draft.counterpartName ?? 'Beneficiário'}</Text>
        <TextField
          label="Valor"
          value={amountText}
          onChangeText={(t) => setAmountText(maskCurrencyInput(t))}
          keyboardType="number-pad"
        />
        <TextField
          label="Descrição (opcional)"
          value={description}
          onChangeText={setDescription}
          maxLength={140}
        />
        <TextField
          label="Data (AAAA-MM-DD, opcional)"
          value={scheduledDate}
          onChangeText={setScheduledDate}
          placeholder="Deixe vazio para envio imediato"
          hint="Use para Pix Agendado, inclusive fins de semana"
        />
        <Button title="Continuar" onPress={next} />
      </ScrollView>
    </View>
  );
}

export function TransferConfirmScreen({ navigation, route }: PixProps<'TransferConfirm'>) {
  const { draft } = route.params;
  const [loading, setLoading] = useState(false);

  const send = async (force?: 'success' | 'failure' | 'pending' | 'cancelled') => {
    if (force === 'cancelled') {
      navigation.navigate('TransferResult', { status: 'cancelled', message: 'Você cancelou a transferência.' });
      return;
    }
    setLoading(true);
    try {
      if (draft.scheduledDate) {
        const { scheduleService } = await import('../../services');
        const item = await scheduleService.create({
          amount: draft.amount,
          counterpartName: draft.counterpartName || 'Beneficiário',
          pixKey: draft.keyValue || draft.document || 'manual',
          scheduledDate: draft.scheduledDate,
          description: draft.description || 'Pix agendado',
        });
        navigation.navigate('TransferResult', {
          status: 'success',
          message: `Agendado para ${item.scheduledDate}`,
        });
        return;
      }
      const result = await pixService.transfer(draft, force);
      navigation.navigate('TransferResult', {
        status: result.status,
        transactionId: result.transaction.id,
      });
    } catch (e) {
      navigation.navigate('TransferResult', {
        status: 'failure',
        message: e instanceof Error ? e.message : 'Falha',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Confirmação" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.confirmAmount}>
          {maskCurrencyInput(String(Math.round(draft.amount * 100)))}
        </Text>
        <Text style={styles.to}>Para {draft.counterpartName}</Text>
        {draft.description ? <Text style={styles.meta}>{draft.description}</Text> : null}
        {draft.scheduledDate ? <Text style={styles.meta}>Agendado: {draft.scheduledDate}</Text> : null}
        {draft.keyValue ? <Text style={styles.meta}>Chave: {draft.keyValue}</Text> : null}

        <Button title="Confirmar transferência" onPress={() => send()} loading={loading} />
        <Text style={styles.demoLabel}>Atalhos de demonstração de status</Text>
        <Button title="Simular falha" variant="outline" onPress={() => send('failure')} style={{ marginTop: spacing.sm }} />
        <Button title="Simular pendência" variant="outline" onPress={() => send('pending')} style={{ marginTop: spacing.sm }} />
        <Button title="Cancelar" variant="ghost" onPress={() => send('cancelled')} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </View>
  );
}

export function TransferResultScreen({ navigation, route }: PixProps<'TransferResult'>) {
  const { status, transactionId, message } = route.params;
  const titleMap = {
    success: 'Transferência concluída',
    failure: 'Transferência não realizada',
    pending: 'Transferência pendente',
    cancelled: 'Transferência cancelada',
  };
  const colorMap = {
    success: colors.success,
    failure: colors.error,
    pending: colors.pending,
    cancelled: colors.textMuted,
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Resultado" onBack={() => navigation.popToTop()} />
      <View style={styles.body}>
        <Text style={[styles.resultTitle, { color: colorMap[status] }]}>{titleMap[status]}</Text>
        {message ? <Text style={styles.meta}>{message}</Text> : null}
        <Text style={[styles.meta, { marginBottom: spacing.xl }]}>
          Esta é uma simulação local — nenhuma operação financeira real foi executada.
        </Text>
        {transactionId && status === 'success' ? (
          <Button
            title="Ver comprovante"
            onPress={() =>
              navigation.getParent()?.navigate('Extrato', {
                screen: 'Receipt',
                params: { transactionId },
              })
            }
          />
        ) : null}
        <Button
          title="Voltar à Área Pix"
          variant={transactionId && status === 'success' ? 'outline' : 'primary'}
          style={{ marginTop: spacing.md }}
          onPress={() => navigation.popToTop()}
        />
      </View>
    </View>
  );
}

export function FavoritesScreen({ navigation }: PixProps<'Favorites'>) {
  const [items, setItems] = useState<Contact[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const list = await contactService.list();
      setItems(list);
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

  const toggle = async (id: string) => {
    await contactService.toggleFavorite(id);
    load();
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Favoritos" onBack={() => navigation.goBack()} />
      <StateView status={status}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.body}
          renderItem={({ item }) => (
            <Pressable style={styles.contact} onPress={() => toggle(item.id)}>
              <Text style={styles.contactName}>
                {item.favorite ? '★ ' : '☆ '}
                {item.name}
              </Text>
              <Text style={styles.contactMeta}>{item.pixKey}</Text>
            </Pressable>
          )}
        />
      </StateView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl },
  section: { ...typography.h3, marginTop: spacing.xl, marginBottom: spacing.md },
  contact: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactName: { ...typography.h3, fontSize: 15 },
  contactMeta: { ...typography.caption, marginTop: 4 },
  scanner: {
    height: 260,
    borderRadius: radii.lg,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  scannerText: { color: colors.white, fontWeight: '600' },
  help: { ...typography.bodySecondary, marginBottom: spacing.xl },
  to: { ...typography.bodySecondary, marginBottom: spacing.lg },
  confirmAmount: { ...typography.amount, textAlign: 'center', marginBottom: spacing.sm },
  meta: { ...typography.caption, textAlign: 'center', marginBottom: spacing.sm },
  demoLabel: { ...typography.label, marginTop: spacing.xl, marginBottom: spacing.sm },
  resultTitle: { ...typography.h2, textAlign: 'center', marginBottom: spacing.md },
});
