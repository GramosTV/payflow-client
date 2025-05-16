export interface ExchangeRate {
  id?: number;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  lastUpdated?: Date;

  // UI display properties
  currencyCode?: string; // Currency code like USD, EUR
  currencyName?: string; // Full name like "US Dollar"
  symbol?: string; // Currency symbol like $, €
}
