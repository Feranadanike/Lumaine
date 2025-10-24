export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'AR$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CL$' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'CO$' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
];

export const getCurrencySymbol = (code: string): string => {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency ? currency.symbol : '$';
};
