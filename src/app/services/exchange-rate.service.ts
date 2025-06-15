import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { ExchangeRate } from '../models/exchange-rate.model';

@Injectable({
  providedIn: 'root',
})
export class ExchangeRateService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all available exchange rates
   */
  getAllExchangeRates(): Observable<ExchangeRate[]> {
    return this.apiService.get<ExchangeRate[]>('public/exchange-rates');
  }

  /**
   * Get popular exchange rates (alias for getAllExchangeRates)
   */
  getExchangeRates(): Observable<ExchangeRate[]> {
    return this.getAllExchangeRates();
  }

  /**
   * Get exchange rate for specific currency pair
   */
  getExchangeRate(baseCurrency: string, targetCurrency: string): Observable<ExchangeRate> {
    return this.apiService.get<ExchangeRate>(
      `public/exchange-rates/${baseCurrency}/${targetCurrency}`
    );
  }

  /**
   * Convert amount between currencies
   */
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Observable<number> {
    return this.apiService.get<number>(
      `public/exchange-rates/convert?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`
    );
  }
}
