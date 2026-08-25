import { formatCpf, formatCurrency, formatPhone, onlyDigits } from '../utils/format';

describe('format utils', () => {
  it('formats currency in pt-BR', () => {
    expect(formatCurrency(1234.5)).toContain('1.234,50');
  });

  it('formats CPF', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });

  it('formats phone', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('extracts digits', () => {
    expect(onlyDigits('529.982.247-25')).toBe('52998224725');
  });
});
