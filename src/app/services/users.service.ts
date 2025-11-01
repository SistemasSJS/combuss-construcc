import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private baseUrl = 'https://apicons.ddns.net:8093/api'; // Cambia esto si tu backend tiene otra URL
  //private baseUrl = 'http://appconstruc.test/api'; // Cambia esto si tu backend tiene otra URL
  //private baseUrl = '/api/users'; // Cambia esto si tu backend tiene otra URL
  //private baseUrl = `${environment.apiUrl}/users`;

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl, this.getUsersHeaders());
  }

  get(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`, this.getUsersHeaders());
  }

  create(payload: Partial<User> & { password: string }): Observable<User> {
    return this.http.post<User>(this.baseUrl, payload, this.getUsersHeaders());
  }

  update(id: number, payload: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, payload, this.getUsersHeaders());
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, this.getUsersHeaders());
  }

  getUsersHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      })
    };
  }
}
