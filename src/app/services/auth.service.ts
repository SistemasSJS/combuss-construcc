import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'https://apicons.ddns.net:8093/api';
  private loggedIn$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private zone: NgZone) {
    const token = localStorage.getItem('token');
    this.loggedIn$.next(!!token);
  }

  login(credentials: { email: string; password: string }) {
    return this.http.post<{ token: string }>(`${this.baseUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('token', response.token);
            this.zone.run(() => this.loggedIn$.next(true));
          }
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    this.zone.run(() => this.loggedIn$.next(false));
  }

  isLoggedIn$() {
    return this.loggedIn$.asObservable();
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      })
    };
  }
}
