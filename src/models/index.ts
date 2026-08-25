export type AsyncStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'
  | 'empty'
  | 'pending'
  | 'unavailable';

export type PixKeyType = 'cpf' | 'cnpj' | 'phone' | 'email' | 'random';

export type TransactionType =
  | 'pix_sent'
  | 'pix_received'
  | 'pix_refund'
  | 'boleto'
  | 'debit'
  | 'credit'
  | 'scheduled';

export type TransactionStatus =
  | 'completed'
  | 'pending'
  | 'failed'
  | 'blocked'
  | 'cancelled'
  | 'unavailable';

export type MedStatus =
  | 'open'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'completed';

export type LimitPeriod = 'day' | 'night' | 'month';
export type BeneficiaryProfile = 'person' | 'company' | 'favorite' | 'new';

export interface Account {
  id: string;
  holderName: string;
  documentMasked: string;
  agency: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  balance: number;
  availableBalance: number;
}

export interface Contact {
  id: string;
  name: string;
  documentMasked: string;
  pixKey?: string;
  pixKeyType?: PixKeyType;
  bankName?: string;
  agency?: string;
  accountNumber?: string;
  favorite: boolean;
  recent: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  description: string;
  counterpartName: string;
  counterpartDocument?: string;
  pixKey?: string;
  createdAt: string;
  completedAt?: string;
  endToEndId: string;
  canRefund: boolean;
  refundedAmount?: number;
}

export interface PixKey {
  id: string;
  type: PixKeyType;
  value: string;
  status: 'active' | 'pending' | 'portability' | 'claim';
  createdAt: string;
}

export interface PixLimit {
  id: string;
  profile: BeneficiaryProfile;
  period: LimitPeriod;
  amount: number;
  used: number;
  label: string;
}

export interface ScheduledPix {
  id: string;
  amount: number;
  counterpartName: string;
  pixKey: string;
  scheduledDate: string;
  description: string;
  status: 'scheduled' | 'cancelled' | 'executed';
}

export interface AutoPixAuth {
  id: string;
  merchantName: string;
  maxAmount: number;
  status: 'pending' | 'active' | 'cancelled' | 'history';
  nextPaymentDate?: string;
  description: string;
}

export interface MedCase {
  id: string;
  protocol: string;
  transactionId: string;
  transactionSummary: string;
  amount: number;
  reason: string;
  description: string;
  status: MedStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ChargeRequest {
  id: string;
  amount?: number;
  identifier?: string;
  pixKeyId: string;
  pixKeyValue: string;
  qrCodePayload: string;
  createdAt: string;
}

export interface TransferDraft {
  method: 'key' | 'manual' | 'copy_paste' | 'qr';
  keyType?: PixKeyType;
  keyValue?: string;
  bankCode?: string;
  agency?: string;
  accountNumber?: string;
  document?: string;
  amount: number;
  description?: string;
  scheduledDate?: string;
  contactId?: string;
  counterpartName?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  document: string;
  email: string;
  biometricsEnabled: boolean;
}
