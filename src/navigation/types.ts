import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { PixKeyType, TransferDraft } from '../models';

export type AuthStackParamList = {
  Login: undefined;
  RecoverPassword: undefined;
  ResetPassword: { codeHint?: string };
  BiometricsSetup: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
};

export type ExtratoStackParamList = {
  ExtratoMain: undefined;
  TransactionDetail: { transactionId: string };
  Receipt: { transactionId: string };
  Refund: { transactionId: string };
};

export type PixStackParamList = {
  PixHome: undefined;
  TransferMethod: undefined;
  TransferByKey: { keyType?: PixKeyType } | undefined;
  TransferManual: undefined;
  CopyPaste: undefined;
  QrScan: undefined;
  TransferAmount: { draft: TransferDraft };
  TransferConfirm: { draft: TransferDraft };
  TransferResult: {
    status: 'success' | 'failure' | 'pending' | 'cancelled';
    transactionId?: string;
    message?: string;
  };
  Charge: undefined;
  ChargeResult: { chargeId: string };
  KeysList: undefined;
  KeyRegister: undefined;
  KeyDetail: { keyId: string };
  Limits: undefined;
  LimitEdit: { limitId: string };
  Favorites: undefined;
  ScheduledList: undefined;
  ScheduledCreate: undefined;
  ScheduledDetail: { scheduledId: string };
  AutoPixList: undefined;
  AutoPixDetail: { autoId: string };
};

export type SupportStackParamList = {
  SupportHome: undefined;
  MedIntro: undefined;
  MedSelectTx: undefined;
  MedForm: { transactionId: string };
  MedResult: { protocol: string; caseId: string };
  MedList: undefined;
  MedDetail: { caseId: string };
};

export type MainTabParamList = {
  Inicio: NavigatorScreenParams<HomeStackParamList>;
  Extrato: NavigatorScreenParams<ExtratoStackParamList>;
  Pix: NavigatorScreenParams<PixStackParamList>;
  Suporte: NavigatorScreenParams<SupportStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type PixProps<T extends keyof PixStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<PixStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type ExtratoProps<T extends keyof ExtratoStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ExtratoStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;

export type SupportProps<T extends keyof SupportStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<SupportStackParamList, T>,
  BottomTabScreenProps<MainTabParamList>
>;
