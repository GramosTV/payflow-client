import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Generic GET method
   */
  get<T>(
    endpoint: string,
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
    }
  ): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, options);
  }

  /**
   * GET method for binary responses like PDF receipts
   */
  getBinary(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${endpoint}`, {
      responseType: 'blob',
    });
  }

  /**
   * Generic POST method
   */
  post<T>(
    endpoint: string,
    body: any,
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
    }
  ): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, options);
  }

  /**
   * Generic PUT method
   */
  put<T>(
    endpoint: string,
    body: any,
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
    }
  ): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, options);
  }

  /**
   * Generic DELETE method
   */
  delete<T>(
    endpoint: string,
    options?: {
      headers?: HttpHeaders | { [header: string]: string | string[] };
      params?: HttpParams | { [param: string]: string | string[] };
    }
  ): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, options);
  }
}
