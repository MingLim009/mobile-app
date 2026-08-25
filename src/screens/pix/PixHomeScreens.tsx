import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import {
  Button,
  Card,
  InfoRow,
  MenuCard,
  ScreenHeader,
  StateView,
  TextField,
} from '../../components';
import type { AsyncStatus, ChargeRequest, PixKey } from '../../models';
import type { PixProps } from '../../navigation/types';
import { chargeService, keysService } from '../../services';
import { colors, spacing, typography } from '../../theme';
import { formatCurrency, maskCurrencyInput, parseCurrencyInput } from '../../utils/format';

export function PixHomeScreen({ navigation }: PixProps<'PixHome'>) {
  return (
    <View style={styles.flex}>
      <ScreenHeader title="Área Pix" />
      <ScrollView contentContainerStyle={styles.body}>
        <MenuCard
          icon="send-outline"
          title="Transferir"
          subtitle="Chave, agência/conta, QR ou copia e cola"
          onPress={() => navigation.navigate('TransferMethod')}
        />
        <MenuCard
          icon="qr-code-outline"
          title="Cobrar / Receber"
          subtitle="Gerar QR Code estático fictício"
          onPress={() => navigation.navigate('Charge')}
        />
        <MenuCard
          icon="key-outline"
          title="Minhas chaves"
          subtitle="Consulta, cadastro e exclusão"
          onPress={() => navigation.navigate('KeysList')}
        />
        <MenuCard
          icon="speedometer-outline"
          title="Limites Pix"
          subtitle="Por perfil, período e noturno"
          onPress={() => navigation.navigate('Limits')}
        />
        <MenuCard
          icon="star-outline"
          title="Favoritos"
          subtitle="Gerenciar contatos favoritos"
          onPress={() => navigation.navigate('Favorites')}
        />
        <MenuCard
          icon="calendar-outline"
          title="Pix Agendado"
          subtitle="Lista, detalhe e cancelamento"
          onPress={() => navigation.navigate('ScheduledList')}
        />
        <MenuCard
          icon="sync-outline"
          title="Pix Automático"
          subtitle="Autorizações e pagamentos"
          onPress={() => navigation.navigate('AutoPixList')}
        />
      </ScrollView>
    </View>
  );
}

export function TransferMethodScreen({ navigation }: PixProps<'TransferMethod'>) {
  return (
    <View style={styles.flex}>
      <ScreenHeader title="Transferir" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <MenuCard icon="person-outline" title="CPF" onPress={() => navigation.navigate('TransferByKey', { keyType: 'cpf' })} />
        <MenuCard icon="business-outline" title="CNPJ" onPress={() => navigation.navigate('TransferByKey', { keyType: 'cnpj' })} />
        <MenuCard icon="call-outline" title="Telefone" onPress={() => navigation.navigate('TransferByKey', { keyType: 'phone' })} />
        <MenuCard icon="mail-outline" title="E-mail" onPress={() => navigation.navigate('TransferByKey', { keyType: 'email' })} />
        <MenuCard icon="shuffle-outline" title="Chave aleatória" onPress={() => navigation.navigate('TransferByKey', { keyType: 'random' })} />
        <MenuCard icon="card-outline" title="Agência e conta" onPress={() => navigation.navigate('TransferManual')} />
        <MenuCard icon="clipboard-outline" title="Pix Copia e Cola" onPress={() => navigation.navigate('CopyPaste')} />
        <MenuCard icon="scan-outline" title="Ler QR Code" onPress={() => navigation.navigate('QrScan')} />
      </ScrollView>
    </View>
  );
}

export function ChargeScreen({ navigation }: PixProps<'Charge'>) {
  const [keys, setKeys] = useState<PixKey[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [keyId, setKeyId] = useState('');
  const [amountText, setAmountText] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setStatus('loading');
          const list = await keysService.list();
          const active = list.filter((k) => k.status === 'active');
          setKeys(active);
          if (active[0]) setKeyId(active[0].id);
          setStatus(active.length ? 'success' : 'empty');
        } catch {
          setStatus('error');
        }
      })();
    }, []),
  );

  const create = async () => {
    setLoading(true);
    try {
      const charge = await chargeService.create({
        pixKeyId: keyId,
        amount: amountText ? parseCurrencyInput(amountText) : undefined,
        identifier: identifier || undefined,
      });
      navigation.navigate('ChargeResult', { chargeId: charge.id });
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Cobrança" onBack={() => navigation.goBack()} />
      <StateView status={status} emptyMessage="Cadastre uma chave Pix ativa primeiro.">
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.label}>Chave para receber</Text>
          {keys.map((k) => (
            <Button
              key={k.id}
              title={`${k.type.toUpperCase()} · ${k.value}`}
              variant={keyId === k.id ? 'primary' : 'outline'}
              style={{ marginBottom: spacing.sm }}
              onPress={() => setKeyId(k.id)}
            />
          ))}
          <TextField
            label="Valor (opcional)"
            value={amountText}
            onChangeText={(t) => setAmountText(maskCurrencyInput(t))}
            keyboardType="number-pad"
          />
          <TextField
            label="Identificador (opcional)"
            value={identifier}
            onChangeText={setIdentifier}
            maxLength={50}
          />
          <Button title="Gerar cobrança" onPress={create} loading={loading} />
        </ScrollView>
      </StateView>
    </View>
  );
}

export function ChargeResultScreen({ navigation, route }: PixProps<'ChargeResult'>) {
  const charge = chargeService.list().find((c) => c.id === route.params.chargeId) as ChargeRequest | undefined;

  const copy = async () => {
    if (!charge) return;
    await Clipboard.setStringAsync(charge.qrCodePayload);
    Alert.alert('Copiado', 'Código Pix copiado (simulado).');
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="QR Code" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.qrBox}>
          <Text style={styles.qrText}>QR</Text>
          <Text style={styles.qrHint}>Representação visual fictícia</Text>
        </View>
        {charge ? (
          <Card>
            <InfoRow label="Chave" value={charge.pixKeyValue} />
            <InfoRow
              label="Valor"
              value={charge.amount ? formatCurrency(charge.amount) : 'Aberto'}
            />
            {charge.identifier ? <InfoRow label="ID" value={charge.identifier} /> : null}
          </Card>
        ) : null}
        <Button title="Copiar código" onPress={copy} />
        <Button title="Nova cobrança" variant="outline" style={{ marginTop: spacing.md }} onPress={() => navigation.replace('Charge')} />
        <Button title="Concluir" variant="ghost" style={{ marginTop: spacing.sm }} onPress={() => navigation.popToTop()} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl },
  label: { ...typography.label, marginBottom: spacing.sm },
  qrBox: {
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.primaryLight,
  },
  qrText: { fontSize: 48, fontWeight: '700', color: colors.primary },
  qrHint: { ...typography.caption, marginTop: spacing.sm },
});
