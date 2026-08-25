import {
  accountFixture,
  authUserFixture,
  autoPixFixture,
  contactsFixture,
  DEMO_CREDENTIALS,
  limitsFixture,
  medCasesFixture,
  medReasons,
  pixKeysFixture,
  scheduledFixture,
  transactionsFixture,
} from '../fixtures';
import type {
  Account,
  AuthUser,
  AutoPixAuth,
  ChargeRequest,
  Contact,
  MedCase,
  PixKey,
  PixKeyType,
  PixLimit,
  ScheduledPix,
  Transaction,
  TransferDraft,
} from '../models';
import { delay, generateId, generateProtocol, onlyDigits } from '../utils/format';

/**
 * Simulated local services — no HTTP/WebSocket.
 * Swap these modules for real API clients in a future phase.
 */

let sessionUser: AuthUser | null = null;
let balanceHidden = false;
let account: Account = { ...accountFixture };
let transactions: Transaction[] = [...transactionsFixture];
let contacts: Contact[] = [...contactsFixture];
let pixKeys: PixKey[] = [...pixKeysFixture];
let limits: PixLimit[] = [...limitsFixture];
let scheduled: ScheduledPix[] = [...scheduledFixture];
let autoPix: AutoPixAuth[] = [...autoPixFixture];
let medCases: MedCase[] = [...medCasesFixture];
let charges: ChargeRequest[] = [];

export const authService = {
  async login(document: string, password: string): Promise<AuthUser> {
    await delay(900);
    const doc = onlyDigits(document);
    if (doc === DEMO_CREDENTIALS.document && password === DEMO_CREDENTIALS.password) {
      sessionUser = { ...authUserFixture };
      return sessionUser;
    }
    throw new Error('CPF ou senha inválidos (use os dados de demonstração).');
  },

  async loginWithBiometrics(): Promise<AuthUser> {
    await delay(700);
    if (!authUserFixture.biometricsEnabled) {
      throw new Error('Biometria ainda não habilitada. Ative após o login.');
    }
    sessionUser = { ...authUserFixture };
    return sessionUser;
  },

  async enableBiometrics(): Promise<void> {
    await delay(500);
    authUserFixture.biometricsEnabled = true;
    if (sessionUser) sessionUser.biometricsEnabled = true;
  },

  async requestPasswordRecovery(document: string): Promise<{ code: string }> {
    await delay(800);
    if (onlyDigits(document) !== DEMO_CREDENTIALS.document) {
      throw new Error('CPF não encontrado na base simulada.');
    }
    return { code: '847291' };
  },

  async resetPassword(code: string, _password: string): Promise<void> {
    await delay(800);
    if (code !== '847291') throw new Error('Código inválido.');
  },

  async logout(): Promise<void> {
    await delay(300);
    sessionUser = null;
  },

  getSession(): AuthUser | null {
    return sessionUser;
  },
};

export const accountService = {
  async getAccount(): Promise<Account> {
    await delay(500);
    return { ...account };
  },

  isBalanceHidden(): boolean {
    return balanceHidden;
  },

  toggleBalanceHidden(): boolean {
    balanceHidden = !balanceHidden;
    return balanceHidden;
  },

  adjustBalance(delta: number): void {
    account = {
      ...account,
      balance: Math.max(0, account.balance + delta),
      availableBalance: Math.max(0, account.availableBalance + delta),
    };
  },
};

export const statementService = {
  async list(filter?: string): Promise<Transaction[]> {
    await delay(600);
    let list = [...transactions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (filter) {
      const f = filter.toLowerCase();
      list = list.filter(
        (t) =>
          t.counterpartName.toLowerCase().includes(f) ||
          t.description.toLowerCase().includes(f),
      );
    }
    return list;
  },

  async getById(id: string): Promise<Transaction> {
    await delay(400);
    const tx = transactions.find((t) => t.id === id);
    if (!tx) throw new Error('Transação não encontrada.');
    return { ...tx };
  },

  async refund(id: string, amount: number): Promise<Transaction> {
    await delay(1000);
    const tx = transactions.find((t) => t.id === id);
    if (!tx || !tx.canRefund) throw new Error('Devolução não disponível.');
    if (amount <= 0 || amount > tx.amount) throw new Error('Valor inválido.');

    tx.canRefund = amount < tx.amount;
    tx.refundedAmount = (tx.refundedAmount ?? 0) + amount;

    const refund: Transaction = {
      id: generateId('tx'),
      type: 'pix_refund',
      status: 'completed',
      amount,
      description: `Devolução de ${tx.description}`,
      counterpartName: tx.counterpartName,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      endToEndId: `E999${Date.now()}REFUND`,
      canRefund: false,
      refundedAmount: amount,
    };
    transactions = [refund, ...transactions];
    accountService.adjustBalance(amount);
    return refund;
  },
};

export const contactService = {
  async list(): Promise<Contact[]> {
    await delay(400);
    return [...contacts];
  },

  async favorites(): Promise<Contact[]> {
    await delay(300);
    return contacts.filter((c) => c.favorite);
  },

  async toggleFavorite(id: string): Promise<Contact> {
    await delay(300);
    const c = contacts.find((x) => x.id === id);
    if (!c) throw new Error('Contato não encontrado.');
    c.favorite = !c.favorite;
    return { ...c };
  },
};

export type TransferResultStatus = 'success' | 'failure' | 'pending' | 'cancelled';

export const pixService = {
  async resolveKey(
    keyType: PixKeyType,
    keyValue: string,
  ): Promise<{ name: string; documentMasked: string }> {
    await delay(700);
    const match = contacts.find((c) => {
      if (!c.pixKey) return false;
      if (c.pixKeyType === keyType && onlyDigits(c.pixKey) === onlyDigits(keyValue)) {
        return true;
      }
      return c.pixKey.toLowerCase() === keyValue.toLowerCase();
    });
    if (match) {
      return { name: match.name, documentMasked: match.documentMasked };
    }
    return {
      name: 'Beneficiário Simulado',
      documentMasked: '***.***.***-**',
    };
  },

  async transfer(
    draft: TransferDraft,
    forceStatus?: TransferResultStatus,
  ): Promise<{ status: TransferResultStatus; transaction: Transaction }> {
    await delay(1200);

    const status: TransferResultStatus =
      forceStatus ??
      (draft.amount >= 9000
        ? 'failure'
        : draft.amount >= 4000
          ? 'pending'
          : 'success');

    if (status === 'cancelled') {
      throw new Error('Transferência cancelada.');
    }

    const tx: Transaction = {
      id: generateId('tx'),
      type: 'pix_sent',
      status:
        status === 'success'
          ? 'completed'
          : status === 'pending'
            ? 'pending'
            : 'failed',
      amount: draft.amount,
      description: draft.description || 'Transferência Pix',
      counterpartName: draft.counterpartName || 'Beneficiário Simulado',
      pixKey: draft.keyValue,
      createdAt: new Date().toISOString(),
      completedAt: status === 'success' ? new Date().toISOString() : undefined,
      endToEndId: `E999${Date.now()}PIX`,
      canRefund: status === 'success',
    };

    if (status === 'success') {
      transactions = [tx, ...transactions];
      accountService.adjustBalance(-draft.amount);
    } else if (status === 'pending') {
      transactions = [tx, ...transactions];
    }

    return { status, transaction: tx };
  },

  async parseCopyPaste(payload: string): Promise<TransferDraft> {
    await delay(600);
    if (!payload.trim()) throw new Error('Código Pix inválido.');
    return {
      method: 'copy_paste',
      keyValue: payload.trim(),
      amount: 75.9,
      description: 'Pix Copia e Cola (simulado)',
      counterpartName: 'Comércio Demo Ltda',
    };
  },

  async parseQr(): Promise<TransferDraft> {
    await delay(900);
    return {
      method: 'qr',
      keyValue: 'qr-simulado@email.ficticio.br',
      amount: 42.0,
      description: 'Pagamento via QR Code',
      counterpartName: 'Loja QR Fictícia',
    };
  },
};

export const keysService = {
  async list(): Promise<PixKey[]> {
    await delay(500);
    return [...pixKeys];
  },

  async register(type: PixKeyType, value?: string): Promise<PixKey> {
    await delay(900);
    const key: PixKey = {
      id: generateId('key'),
      type,
      value:
        type === 'random'
          ? `${cryptoRandom()}`
          : value || authUserFixture.document,
      status: type === 'random' ? 'pending' : 'active',
      createdAt: new Date().toISOString(),
    };
    pixKeys = [key, ...pixKeys];
    return key;
  },

  async remove(id: string): Promise<void> {
    await delay(600);
    pixKeys = pixKeys.filter((k) => k.id !== id);
  },

  async requestPortability(id: string): Promise<PixKey> {
    await delay(800);
    const key = pixKeys.find((k) => k.id === id);
    if (!key) throw new Error('Chave não encontrada.');
    key.status = 'portability';
    return { ...key };
  },

  async requestClaim(id: string): Promise<PixKey> {
    await delay(800);
    const key = pixKeys.find((k) => k.id === id);
    if (!key) throw new Error('Chave não encontrada.');
    key.status = 'claim';
    return { ...key };
  },
};

export const limitsService = {
  async list(): Promise<PixLimit[]> {
    await delay(500);
    return [...limits];
  },

  async requestChange(id: string, amount: number): Promise<PixLimit> {
    await delay(900);
    const lim = limits.find((l) => l.id === id);
    if (!lim) throw new Error('Limite não encontrado.');
    lim.amount = amount;
    return { ...lim };
  },
};

export const scheduleService = {
  async list(): Promise<ScheduledPix[]> {
    await delay(500);
    return [...scheduled];
  },

  async create(data: Omit<ScheduledPix, 'id' | 'status'>): Promise<ScheduledPix> {
    await delay(800);
    const item: ScheduledPix = {
      ...data,
      id: generateId('sch'),
      status: 'scheduled',
    };
    scheduled = [item, ...scheduled];
    return item;
  },

  async cancel(id: string): Promise<void> {
    await delay(500);
    scheduled = scheduled.map((s) =>
      s.id === id ? { ...s, status: 'cancelled' as const } : s,
    );
  },
};

export const autoPixService = {
  async list(): Promise<AutoPixAuth[]> {
    await delay(500);
    return [...autoPix];
  },

  async approve(id: string): Promise<AutoPixAuth> {
    await delay(700);
    const item = autoPix.find((a) => a.id === id);
    if (!item) throw new Error('Autorização não encontrada.');
    item.status = 'active';
    return { ...item };
  },

  async cancel(id: string): Promise<void> {
    await delay(600);
    autoPix = autoPix.map((a) =>
      a.id === id ? { ...a, status: 'cancelled' as const } : a,
    );
  },
};

export const chargeService = {
  async create(input: {
    pixKeyId: string;
    amount?: number;
    identifier?: string;
  }): Promise<ChargeRequest> {
    await delay(800);
    const key = pixKeys.find((k) => k.id === input.pixKeyId);
    if (!key) throw new Error('Selecione uma chave Pix.');
    const charge: ChargeRequest = {
      id: generateId('chg'),
      amount: input.amount,
      identifier: input.identifier,
      pixKeyId: key.id,
      pixKeyValue: key.value,
      qrCodePayload: `00020126580014BR.GOV.BCB.PIX0136${key.value}520400005303986540${(input.amount ?? 0).toFixed(2)}5802BR5925TWO-S DEMO6009SAO PAULO62070503***6304ABCD`,
      createdAt: new Date().toISOString(),
    };
    charges = [charge, ...charges];
    return charge;
  },

  list(): ChargeRequest[] {
    return [...charges];
  },
};

export const medService = {
  reasons: medReasons,

  async list(): Promise<MedCase[]> {
    await delay(500);
    return [...medCases];
  },

  async getById(id: string): Promise<MedCase> {
    await delay(400);
    const item = medCases.find((m) => m.id === id);
    if (!item) throw new Error('Contestação não encontrada.');
    return { ...item };
  },

  async create(input: {
    transactionId: string;
    reason: string;
    description: string;
  }): Promise<MedCase> {
    await delay(1000);
    const tx = transactions.find((t) => t.id === input.transactionId);
    if (!tx) throw new Error('Transação não encontrada.');
    const item: MedCase = {
      id: generateId('med'),
      protocol: generateProtocol('MED'),
      transactionId: tx.id,
      transactionSummary: `${tx.type} — ${tx.counterpartName}`,
      amount: tx.amount,
      reason: input.reason,
      description: input.description,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    medCases = [item, ...medCases];
    return item;
  },
};

function cryptoRandom(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
