/** Símbolo de moneda de la aplicación. Si cambia la moneda, se actualiza solo aquí. */
export const APP_CURRENCY = '$';

export interface FormatMoneyOptions {
  decimals?: number;
  sign?: boolean;
}

export function formatMoney(n: number, options: FormatMoneyOptions = {}): string {
  const { decimals = 0, sign = false } = options;
  const abs = Math.abs(n).toLocaleString(
    'en-US',
    decimals > 0 ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals } : undefined
  );
  const prefix = n < 0 && sign ? '-' : '';
  return `${prefix}${APP_CURRENCY} ${abs}`;
}