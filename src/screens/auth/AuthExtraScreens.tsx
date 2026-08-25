import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, ScreenHeader, TextField } from '../../components';
import type { AuthProps } from '../../navigation/types';
import { authService } from '../../services';
import { colors, spacing, typography } from '../../theme';
import { formatCpf } from '../../utils/format';
import {
  recoverSchema,
  resetPasswordSchema,
  type RecoverForm,
  type ResetPasswordForm,
} from '../../validation/schemas';

export function RecoverPasswordScreen({ navigation }: AuthProps<'RecoverPassword'>) {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<RecoverForm>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { document: '' },
  });

  const onSubmit = async (data: RecoverForm) => {
    setLoading(true);
    try {
      const res = await authService.requestPasswordRecovery(data.document);
      Alert.alert(
        'Código enviado (simulado)',
        `Use o código ${res.code} na próxima tela.`,
        [{ text: 'Continuar', onPress: () => navigation.navigate('ResetPassword', { codeHint: res.code }) }],
      );
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Recuperar senha" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.text}>
          Informe o CPF cadastrado. Enviaremos um código fictício para redefinição.
        </Text>
        <Controller
          control={control}
          name="document"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="CPF"
              value={value}
              onChangeText={(t) => onChange(formatCpf(t))}
              keyboardType="number-pad"
              error={errors.document?.message}
            />
          )}
        />
        <Button title="Enviar código" onPress={handleSubmit(onSubmit)} loading={loading} />
      </View>
    </View>
  );
}

export function ResetPasswordScreen({ navigation, route }: AuthProps<'ResetPassword'>) {
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      code: route.params?.codeHint ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    try {
      await authService.resetPassword(data.code, data.password);
      Alert.alert('Senha redefinida', 'Simulação concluída. Faça login novamente.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Nova senha" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Controller
          control={control}
          name="code"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Código"
              value={value}
              onChangeText={onChange}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.code?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Nova senha"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              error={errors.password?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <TextField
              label="Confirmar senha"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={8}
              error={errors.confirmPassword?.message}
            />
          )}
        />
        <Button title="Redefinir" onPress={handleSubmit(onSubmit)} loading={loading} />
      </View>
    </View>
  );
}

export function BiometricsSetupScreen({ navigation }: AuthProps<'BiometricsSetup'>) {
  const [loading, setLoading] = useState(false);

  const enable = async () => {
    setLoading(true);
    try {
      await authService.enableBiometrics();
      Alert.alert('Biometria ativada', 'Na próxima vez você poderá usar o atalho visual.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="Biometria" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.text}>
          Habilite a biometria apenas visualmente nesta etapa (sem sensor real obrigatório).
        </Text>
        <Button title="Ativar biometria" onPress={enable} loading={loading} />
        <Button title="Agora não" variant="ghost" onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl },
  text: { ...typography.bodySecondary, marginBottom: spacing.xl },
});
