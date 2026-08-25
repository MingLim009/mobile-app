import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AsyncStatus } from '../models';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from './Button';

interface Props {
  status: AsyncStatus;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  errorMessage?: string;
  pendingMessage?: string;
  unavailableMessage?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function StateView({
  status,
  loadingMessage = 'Carregando…',
  emptyTitle = 'Nada por aqui',
  emptyMessage = 'Não há itens para exibir.',
  errorMessage = 'Algo deu errado. Tente novamente.',
  pendingMessage = 'Em processamento…',
  unavailableMessage = 'Informação temporariamente indisponível.',
  onRetry,
  children,
  style,
}: Props) {
  if (status === 'success' || status === 'idle') {
    return <>{children}</>;
  }

  if (status === 'loading') {
    return (
      <View style={[styles.center, style]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>{loadingMessage}</Text>
      </View>
    );
  }

  const map: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; msg: string }> = {
    empty: { icon: 'file-tray-outline', color: colors.textMuted, title: emptyTitle, msg: emptyMessage },
    error: { icon: 'alert-circle-outline', color: colors.error, title: 'Falha', msg: errorMessage },
    pending: { icon: 'time-outline', color: colors.pending, title: 'Pendente', msg: pendingMessage },
    unavailable: { icon: 'cloud-offline-outline', color: colors.warning, title: 'Indisponível', msg: unavailableMessage },
  };

  const cfg = map[status] ?? map.error;

  return (
    <View style={[styles.center, style]}>
      <View style={[styles.iconWrap, { backgroundColor: `${cfg.color}15` }]}>
        <Ionicons name={cfg.icon} size={36} color={cfg.color} />
      </View>
      <Text style={styles.title}>{cfg.title}</Text>
      <Text style={styles.message}>{cfg.msg}</Text>
      {onRetry && (status === 'error' || status === 'unavailable') ? (
        <Button title="Tentar novamente" onPress={onRetry} style={{ marginTop: spacing.lg }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h3, marginBottom: spacing.sm },
  message: { ...typography.bodySecondary, textAlign: 'center' },
});
