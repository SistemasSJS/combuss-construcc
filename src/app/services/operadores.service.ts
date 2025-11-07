import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Operador {
  id: number;
  nombre: string;
  activo: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class OperadorService {
  private http = inject(HttpClient);
  private baseUrl = 'https://apicons.ddns.net:8093/api/operadors'; // Cambia esto si tu backend tiene otra URL
  //private baseUrl = 'http://appconstruc.test/api'; // Cambia esto si tu backend tiene otra URL
  //private baseUrl = '/api/users'; // Cambia esto si tu backend tiene otra URL
  //private baseUrl = `${environment.apiUrl}/users`;

  list(): Observable<Operador[]> {
    return this.http.get<Operador[]>(this.baseUrl, this.getOperadorHeaders());
  }

  get(id: number): Observable<Operador> {
    return this.http.get<Operador>(`${this.baseUrl}/${id}`, this.getOperadorHeaders());
  }

  create(payload: Partial<Operador>): Observable<Operador> {
    return this.http.post<Operador>(this.baseUrl, payload, this.getOperadorHeaders());
  }

  update(id: number, payload: Partial<Operador>): Observable<Operador> {
    return this.http.put<Operador>(`${this.baseUrl}/${id}`, payload, this.getOperadorHeaders());
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.getOperadorHeaders());
  }

  getOperadorHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      })
    };
  }
}
