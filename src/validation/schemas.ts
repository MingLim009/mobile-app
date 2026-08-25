import { z } from 'zod';
import { onlyDigits } from '../utils/format';

export const loginSchema = z.object({
  document: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((v) => onlyDigits(v).length === 11, 'CPF inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter ao menos 6 dígitos')
    .max(8, 'Senha deve ter no máximo 8 dígitos'),
});

export const recoverSchema = z.object({
  document: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((v) => onlyDigits(v).length === 11, 'CPF inválido'),
});

export const resetPasswordSchema = z
  .object({
    code: z.string().length(6, 'Código de 6 dígitos'),
    password: z.string().min(6, 'Mínimo 6 dígitos').max(8),
    confirmPassword: z.string().min(6).max(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  });

export const pixKeyTransferSchema = z.object({
  keyType: z.enum(['cpf', 'cnpj', 'phone', 'email', 'random']),
  keyValue: z.string().min(3, 'Informe a chave'),
});

export const manualTransferSchema = z.object({
  bankCode: z.string().min(1, 'Informe o banco'),
  agency: z.string().min(1, 'Informe a agência'),
  accountNumber: z.string().min(3, 'Informe a conta'),
  document: z.string().min(11, 'Informe CPF/CNPJ'),
});

export const amountSchema = z.object({
  amount: z.number().positive('Informe um valor maior que zero'),
  description: z.string().max(140).optional(),
  scheduledDate: z.string().optional(),
});

export const registerKeySchema = z.object({
  type: z.enum(['cpf', 'cnpj', 'phone', 'email', 'random']),
  value: z.string().optional(),
});

export const limitChangeSchema = z.object({
  amount: z.number().positive('Informe o novo limite'),
});

export const medSchema = z.object({
  reason: z.string().min(1, 'Selecione o motivo'),
  description: z.string().min(10, 'Descreva com ao menos 10 caracteres'),
});

export const chargeSchema = z.object({
  pixKeyId: z.string().min(1, 'Selecione uma chave'),
  amount: z.number().optional(),
  identifier: z.string().max(50).optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RecoverForm = z.infer<typeof recoverSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type AmountForm = z.infer<typeof amountSchema>;
export type MedForm = z.infer<typeof medSchema>;
