import React, { useState } from 'react';
import {
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
import { colors, radii, spacing, typography } from '../../theme';
import { formatCpf, onlyDigits } from '../../utils/format';
import { loginSchema, type LoginForm } from '../../validation/schemas';

export function LoginScreen({ navigation }: AuthProps<'Login'>) {
  const { setUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      document: formatCpf(DEMO_CREDENTIALS.document),
      password: DEMO_CREDENTIALS.password,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setFormError(null);
    setLoading(true);
    try {
      const user = await authService.login(data.document, data.password);
      setUser(user);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  /** Fallback if resolver fails silently on web */
  const onPressLogin = () => {
    setFormError(null);
    const values = getValues();
    const docOk = onlyDigits(values.document ?? '').length === 11;
    const passOk = (values.password ?? '').length >= 6;
    if (!docOk || !passOk) {
      handleSubmit(onSubmit)();
      return;
    }
    void onSubmit(values);
  };

  const onBiometrics = async () => {
    setFormError(null);
    setBioLoading(true);
    try {
      const user = await authService.loginWithBiometrics();
      setUser(user);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Biometria indisponível');
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

        {formError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        ) : null}

        <Button title="Entrar" onPress={onPressLogin} loading={loading} testID="login-button" />

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
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: { color: colors.error, fontSize: 14 },
  bioHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    justifyContent: 'center',
  },
  bioText: { ...typography.caption },
});
