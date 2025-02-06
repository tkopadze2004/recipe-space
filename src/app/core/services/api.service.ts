import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  jsonUrl = environment.jsonUrl;

  http: HttpClient = inject(HttpClient);

  get<T>(path: string, params?: HttpParams): Observable<T> {
    const httpparams = params || new HttpParams();
    return this.http.get<T>(`${this.jsonUrl}${path}`, {
      params: httpparams,
    });
  }
  post<T>(path: string, body: T): Observable<T> {
    return this.http.post<T>(`${this.jsonUrl}${path}`, body);
  }

  put<T>(path: string, body: T): Observable<T> {
    return this.http.put<T>(`${this.jsonUrl}${path}`, body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.jsonUrl}${path}`);
  }
}
