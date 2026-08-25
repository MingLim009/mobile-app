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
import {
  Button,
  Card,
  InfoRow,
  MenuCard,
  ScreenHeader,
  StateView,
  TextField,
} from '../../components';
import type {
  AsyncStatus,
  AutoPixAuth,
  PixKey,
  PixKeyType,
  PixLimit,
  ScheduledPix,
} from '../../models';
import type { PixProps } from '../../navigation/types';
import {
  autoPixService,
  keysService,
  limitsService,
  scheduleService,
} from '../../services';
import { colors, spacing, typography } from '../../theme';
import {
  formatCurrency,
  formatCpf,
  formatPhone,
  maskCurrencyInput,
  parseCurrencyInput,
} from '../../utils/format';

export function KeysListScreen({ navigation }: PixProps<'KeysList'>) {
  const [items, setItems] = useState<PixKey[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const list = await keysService.list();
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

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Chaves Pix" onBack={() => navigation.goBack()} />
      <StateView status={status} emptyMessage="Nenhuma chave cadastrada.">
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.body}
          ListHeaderComponent={
            <Button title="Cadastrar chave" onPress={() => navigation.navigate('KeyRegister')} style={{ marginBottom: spacing.lg }} />
          }
          renderItem={({ item }) => (
            <MenuCard
              icon="key-outline"
              title={`${item.type.toUpperCase()}`}
              subtitle={`${item.value} · ${item.status}`}
              onPress={() => navigation.navigate('KeyDetail', { keyId: item.id })}
            />
          )}
        />
      </StateView>
    </View>
  );
}

export function KeyRegisterScreen({ navigation }: PixProps<'KeyRegister'>) {
  const [type, setType] = useState<PixKeyType>('email');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const types: PixKeyType[] = ['cpf', 'cnpj', 'phone', 'email', 'random'];

  const submit = async () => {
    setLoading(true);
    try {
      await keysService.register(type, type === 'random' ? undefined : value);
      Alert.alert('Chave cadastrada', 'Simulação concluída.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Nova chave" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        {types.map((t) => (
          <Button
            key={t}
            title={t.toUpperCase()}
            variant={type === t ? 'primary' : 'outline'}
            style={{ marginBottom: spacing.sm }}
            onPress={() => setType(t)}
          />
        ))}
        {type !== 'random' ? (
          <TextField
            label="Valor da chave"
            value={value}
            onChangeText={(t) => {
              if (type === 'cpf') setValue(formatCpf(t));
              else if (type === 'phone') setValue(formatPhone(t));
              else setValue(t);
            }}
            autoCapitalize="none"
          />
        ) : (
          <Text style={styles.help}>Uma chave aleatória será gerada automaticamente.</Text>
        )}
        <Button title="Cadastrar" onPress={submit} loading={loading} />
      </ScrollView>
    </View>
  );
}

export function KeyDetailScreen({ navigation, route }: PixProps<'KeyDetail'>) {
  const [key, setKey] = useState<PixKey | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      keysService.list().then((list) => {
        setKey(list.find((k) => k.id === route.params.keyId) ?? null);
      });
    }, [route.params.keyId]),
  );

  const remove = async () => {
    if (!key) return;
    setLoading(true);
    try {
      await keysService.remove(key.id);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const portability = async () => {
    if (!key) return;
    const updated = await keysService.requestPortability(key.id);
    setKey(updated);
    Alert.alert('Portabilidade', 'Solicitação visual registrada.');
  };

  const claim = async () => {
    if (!key) return;
    const updated = await keysService.requestClaim(key.id);
    setKey(updated);
    Alert.alert('Reivindicação', 'Solicitação visual registrada.');
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Detalhe da chave" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        {key ? (
          <Card>
            <InfoRow label="Tipo" value={key.type} />
            <InfoRow label="Valor" value={key.value} />
            <InfoRow label="Status" value={key.status} />
          </Card>
        ) : null}
        <Button title="Solicitar portabilidade" variant="outline" onPress={portability} />
        <Button title="Reivindicar posse" variant="outline" onPress={claim} style={{ marginTop: spacing.sm }} />
        <Button title="Excluir chave" variant="danger" onPress={remove} loading={loading} style={{ marginTop: spacing.lg }} />
      </View>
    </View>
  );
}

export function LimitsScreen({ navigation }: PixProps<'Limits'>) {
  const [items, setItems] = useState<PixLimit[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setStatus('loading');
          const list = await limitsService.list();
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
      <ScreenHeader title="Limites Pix" onBack={() => navigation.goBack()} />
      <StateView status={status}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.body}
          renderItem={({ item }) => (
            <MenuCard
              icon="speedometer-outline"
              title={item.label}
              subtitle={`Usado ${formatCurrency(item.used)} de ${formatCurrency(item.amount)}`}
              onPress={() => navigation.navigate('LimitEdit', { limitId: item.id })}
            />
          )}
        />
      </StateView>
    </View>
  );
}

export function LimitEditScreen({ navigation, route }: PixProps<'LimitEdit'>) {
  const [item, setItem] = useState<PixLimit | null>(null);
  const [amountText, setAmountText] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      limitsService.list().then((list) => {
        const found = list.find((l) => l.id === route.params.limitId) ?? null;
        setItem(found);
        if (found) setAmountText(maskCurrencyInput(String(Math.round(found.amount * 100))));
      });
    }, [route.params.limitId]),
  );

  const save = async () => {
    if (!item) return;
    setLoading(true);
    try {
      await limitsService.requestChange(item.id, parseCurrencyInput(amountText));
      Alert.alert('Solicitação enviada', 'Alteração de limite simulada.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Alterar limite" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        {item ? (
          <>
            <Text style={styles.help}>{item.label}</Text>
            <TextField
              label="Novo valor"
              value={amountText}
              onChangeText={(t) => setAmountText(maskCurrencyInput(t))}
              keyboardType="number-pad"
            />
            <Button title="Solicitar aumento/redução" onPress={save} loading={loading} />
          </>
        ) : null}
      </View>
    </View>
  );
}

export function ScheduledListScreen({ navigation }: PixProps<'ScheduledList'>) {
  const [items, setItems] = useState<ScheduledPix[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const list = await scheduleService.list();
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

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Pix Agendado" onBack={() => navigation.goBack()} />
      <StateView status={status}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.body}
          ListHeaderComponent={
            <Button title="Novo agendamento" onPress={() => navigation.navigate('ScheduledCreate')} style={{ marginBottom: spacing.lg }} />
          }
          renderItem={({ item }) => (
            <MenuCard
              icon="calendar-outline"
              title={item.counterpartName}
              subtitle={`${item.scheduledDate} · ${formatCurrency(item.amount)} · ${item.status}`}
              onPress={() => navigation.navigate('ScheduledDetail', { scheduledId: item.id })}
            />
          )}
        />
      </StateView>
    </View>
  );
}

export function ScheduledCreateScreen({ navigation }: PixProps<'ScheduledCreate'>) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [date, setDate] = useState('2026-09-15');
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const amount = parseCurrencyInput(amountText);
    if (!name || !key || !date || amount <= 0) {
      Alert.alert('Campos', 'Preencha todos os campos obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const item = await scheduleService.create({
        counterpartName: name,
        pixKey: key,
        scheduledDate: date,
        amount,
        description: description || 'Pix agendado',
      });
      Alert.alert('Agendado', `Comprovante fictício · ${item.id}`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Novo agendamento" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body}>
        <TextField label="Beneficiário" value={name} onChangeText={setName} />
        <TextField label="Chave Pix" value={key} onChangeText={setKey} autoCapitalize="none" />
        <TextField label="Data (AAAA-MM-DD)" value={date} onChangeText={setDate} hint="Aceita fins de semana e feriados" />
        <TextField label="Valor" value={amountText} onChangeText={(t) => setAmountText(maskCurrencyInput(t))} keyboardType="number-pad" />
        <TextField label="Descrição" value={description} onChangeText={setDescription} />
        <Button title="Agendar" onPress={save} loading={loading} />
      </ScrollView>
    </View>
  );
}

export function ScheduledDetailScreen({ navigation, route }: PixProps<'ScheduledDetail'>) {
  const [item, setItem] = useState<ScheduledPix | null>(null);

  useFocusEffect(
    useCallback(() => {
      scheduleService.list().then((list) => {
        setItem(list.find((s) => s.id === route.params.scheduledId) ?? null);
      });
    }, [route.params.scheduledId]),
  );

  const cancel = async () => {
    if (!item) return;
    await scheduleService.cancel(item.id);
    Alert.alert('Cancelado', 'Agendamento cancelado visualmente.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Detalhe agendamento" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        {item ? (
          <Card>
            <InfoRow label="Para" value={item.counterpartName} />
            <InfoRow label="Chave" value={item.pixKey} />
            <InfoRow label="Valor" value={formatCurrency(item.amount)} />
            <InfoRow label="Data" value={item.scheduledDate} />
            <InfoRow label="Status" value={item.status} />
            <InfoRow label="Descrição" value={item.description} />
          </Card>
        ) : null}
        {item?.status === 'scheduled' ? (
          <Button title="Cancelar agendamento" variant="danger" onPress={cancel} />
        ) : null}
      </View>
    </View>
  );
}

export function AutoPixListScreen({ navigation }: PixProps<'AutoPixList'>) {
  const [items, setItems] = useState<AutoPixAuth[]>([]);
  const [status, setStatus] = useState<AsyncStatus>('loading');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setStatus('loading');
          const list = await autoPixService.list();
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
      <ScreenHeader title="Pix Automático" onBack={() => navigation.goBack()} />
      <StateView status={status}>
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.body}
          renderItem={({ item }) => (
            <MenuCard
              icon="sync-outline"
              title={item.merchantName}
              subtitle={`${item.status} · máx. ${formatCurrency(item.maxAmount)}`}
              onPress={() => navigation.navigate('AutoPixDetail', { autoId: item.id })}
            />
          )}
        />
      </StateView>
    </View>
  );
}

export function AutoPixDetailScreen({ navigation, route }: PixProps<'AutoPixDetail'>) {
  const [item, setItem] = useState<AutoPixAuth | null>(null);

  const reload = useCallback(() => {
    autoPixService.list().then((list) => {
      setItem(list.find((a) => a.id === route.params.autoId) ?? null);
    });
  }, [route.params.autoId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Autorização" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        {item ? (
          <Card>
            <InfoRow label="Estabelecimento" value={item.merchantName} />
            <InfoRow label="Limite" value={formatCurrency(item.maxAmount)} />
            <InfoRow label="Status" value={item.status} />
            <InfoRow label="Descrição" value={item.description} />
            {item.nextPaymentDate ? (
              <InfoRow label="Próximo pagamento" value={item.nextPaymentDate} />
            ) : null}
          </Card>
        ) : null}
        {item?.status === 'pending' ? (
          <Button
            title="Aprovar autorização"
            onPress={async () => {
              await autoPixService.approve(item.id);
              reload();
            }}
          />
        ) : null}
        {item && (item.status === 'active' || item.status === 'pending') ? (
          <Button
            title="Cancelar autorização"
            variant="danger"
            style={{ marginTop: spacing.md }}
            onPress={async () => {
              await autoPixService.cancel(item.id);
              navigation.goBack();
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl },
  help: { ...typography.bodySecondary, marginBottom: spacing.lg },
});
