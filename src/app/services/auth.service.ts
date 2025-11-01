// src/app/core/services/auth.service.ts
import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';


export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private zone = inject(NgZone);

  //private baseUrl = 'https://apicons.ddns.net:8093/api'; // Cambia esto si tu backend tiene otra URL
  //private baseUrl = 'http://appconstruc.test/api'; // Cambia esto si tu backend tiene otra URL
  private baseUrl = 'api'; // Cambia esto si tu backend tiene otra URL
  public loggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem('token'));
  isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }


  login(credentials: { email: string; password: string }): Observable<{ token: string; user: AuthUser }> {
    return this.http
      .post<{ token: string; user: AuthUser }>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          // guarda token + user
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.zone.run(() => this.loggedIn$.next(true));
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}, this.getAuthHeaders()).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.zone.run(() => this.loggedIn$.next(false));
      })
    );
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token
      ? { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      : {};
  }

  get currentUser(): AuthUser | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) as AuthUser : null;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }
}
