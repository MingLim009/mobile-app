import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AuthUser } from '../models';
import { accountService, authService } from '../services';

interface AppContextValue {
  user: AuthUser | null;
  balanceHidden: boolean;
  setUser: (user: AuthUser | null) => void;
  toggleBalance: () => void;
  refreshBalanceHidden: () => void;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(authService.getSession());
  const [balanceHidden, setBalanceHidden] = useState(accountService.isBalanceHidden());

  const toggleBalance = useCallback(() => {
    setBalanceHidden(accountService.toggleBalanceHidden());
  }, []);

  const refreshBalanceHidden = useCallback(() => {
    setBalanceHidden(accountService.isBalanceHidden());
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      balanceHidden,
      setUser,
      toggleBalance,
      refreshBalanceHidden,
      logout,
    }),
    [user, balanceHidden, toggleBalance, refreshBalanceHidden, logout],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
