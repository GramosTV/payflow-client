import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ErrorHandlingService } from './error-handling.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private defaultTimeout = 30000; // 30 seconds

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlingService
  ) {}

  /**
   * Generic GET method
   */
  get<T>(
    endpoint: string,
    params?: any,
    timeoutMs = this.defaultTimeout
  ): Observable<T> {
    const options = { params: this.buildParams(params) };

    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, options).pipe(
      timeout(timeoutMs),
      catchError((error) => {
        this.errorHandler.handleApiError(error, `GET ${endpoint}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET method for binary responses like PDF receipts
   */
  getBinary(
    endpoint: string,
    timeoutMs = this.defaultTimeout
  ): Observable<Blob> {
    return this.http
      .get(`${this.apiUrl}/${endpoint}`, {
        responseType: 'blob',
      })
      .pipe(
        timeout(timeoutMs),
        catchError((error) => {
          this.errorHandler.handleApiError(error, `GET binary ${endpoint}`);
          return throwError(() => error);
        })
      );
  }

  /**
   * Generic POST method
   */
  post<T>(
    endpoint: string,
    body: any,
    timeoutMs = this.defaultTimeout
  ): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body).pipe(
      timeout(timeoutMs),
      catchError((error) => {
        this.errorHandler.handleApiError(error, `POST ${endpoint}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generic PUT method
   */
  put<T>(
    endpoint: string,
    body: any,
    timeoutMs = this.defaultTimeout
  ): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body).pipe(
      timeout(timeoutMs),
      catchError((error) => {
        this.errorHandler.handleApiError(error, `PUT ${endpoint}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generic DELETE method
   */
  delete<T>(endpoint: string, timeoutMs = this.defaultTimeout): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`).pipe(
      timeout(timeoutMs),
      catchError((error) => {
        this.errorHandler.handleApiError(error, `DELETE ${endpoint}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET method for blob responses (QR code images)
   */
  getBlob(endpoint: string, timeoutMs = this.defaultTimeout): Observable<Blob> {
    const options = {
      responseType: 'blob' as 'json',
      headers: new HttpHeaders({
        Accept: 'image/png, image/jpeg, application/octet-stream',
      }),
    };

    return this.http.get<Blob>(`${this.apiUrl}/${endpoint}`, options).pipe(
      timeout(timeoutMs),
      catchError((error) => {
        this.errorHandler.handleApiError(error, `GET blob ${endpoint}`);
        return throwError(() => error);
      })
    );
  }

  private buildParams(params?: any): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return httpParams;
  }
}
