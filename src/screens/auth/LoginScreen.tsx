import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Button, TextField } from '../../components';
import { useApp } from '../../context/AppContext';
import { DEMO_CREDENTIALS } from '../../fixtures';
import type { AuthProps } from '../../navigation/types';
import { authService } from '../../services';
import { colors, spacing, typography } from '../../theme';
import { formatCpf } from '../../utils/format';
import { loginSchema, type LoginForm } from '../../validation/schemas';

export function LoginScreen({ navigation }: AuthProps<'Login'>) {
  const { setUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      document: formatCpf(DEMO_CREDENTIALS.document),
      password: DEMO_CREDENTIALS.password,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const user = await authService.login(data.document, data.password);
      setUser(user);
    } catch (e) {
      Alert.alert('Falha no login', e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const onBiometrics = async () => {
    setBioLoading(true);
    try {
      const user = await authService.loginWithBiometrics();
      setUser(user);
    } catch (e) {
      Alert.alert('Biometria', e instanceof Error ? e.message : 'Indisponível');
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBlock}>
          <Text style={styles.brand}>Two-s</Text>
          <Text style={styles.tagline}>Cooperativa digital — demonstração</Text>
        </View>

        <Text style={styles.title}>Acesse sua conta</Text>
        <Text style={styles.hint}>
          Demo: CPF {formatCpf(DEMO_CREDENTIALS.document)} · senha {DEMO_CREDENTIALS.password}
        </Text>

        <Controller
          control={control}
          name="document"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="CPF"
              value={value}
              onChangeText={(t: string) => onChange(formatCpf(t))}
              keyboardType="number-pad"
              error={errors.document?.message}
              autoCapitalize="none"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Senha"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              error={errors.password?.message}
            />
          )}
        />

        <Pressable onPress={() => navigation.navigate('RecoverPassword')}>
          <Text style={styles.link}>Esqueci minha senha</Text>
        </Pressable>

        <Button title="Entrar" onPress={handleSubmit(onSubmit)} loading={loading} testID="login-button" />

        <Button
          title="Entrar com biometria"
          variant="outline"
          onPress={onBiometrics}
          loading={bioLoading}
          style={{ marginTop: spacing.md }}
        />

        <View style={styles.bioHint}>
          <Ionicons name="finger-print" size={20} color={colors.textMuted} />
          <Text style={styles.bioText}>Fluxo visual de biometria (simulado)</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingTop: 72 },
  brandBlock: { marginBottom: spacing.xxl },
  brand: { ...typography.brand, fontSize: 36 },
  tagline: { ...typography.bodySecondary, marginTop: spacing.xs },
  title: { ...typography.h1, marginBottom: spacing.sm },
  hint: { ...typography.caption, marginBottom: spacing.xl },
  link: {
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xl,
    alignSelf: 'flex-end',
  },
  bioHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    justifyContent: 'center',
  },
  bioText: { ...typography.caption },
});
