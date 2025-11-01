// src/app/services/cargas.service.ts
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Carga {
  id?: number;
  serie: string;
  folio: number;
  fecha: string;     // 'YYYY-MM-DD'
  id_equipo: number;
  litros: number;
  // ... agrega lo que uses
}

export interface EquipoDto {
  id: number;
  desc_equipo: string;
  id_combustible: number | null;
  noserie: string;
  peso: number;
}

export interface CargasResponse {
  data: Carga[];
  meta: { page: number; per_page: number; total: number };
}



@Injectable({ providedIn: 'root' })
export class CargasService {
  //private base = 'https://apicons.ddns.net:8093/api'; // AJUSTA
  //private base = 'http://appconstruc.test/api';
  private base = '/api';
  
  //private base = 'http://192.168.100.6:8000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private authHeaders() {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  

  listByMonth(ym: string, page = 1, per = 30): Observable<CargasResponse> {
    const params = new HttpParams()
      .set('mes', ym)
      .set('page', page)
      .set('per_page', per);

    return this.http.get<CargasResponse>(`${this.base}/cargas`, {
      headers: this.authHeaders(),
      params
    });
  }

  // ... (getNextFolio, crearCarga, etc.)
  getNextFolio(serie: string) {
    return this.http.get<{nextFolio:number}>(`${this.base}/cargas/next-folio`, { 
      headers: this.authHeaders(),
      params: { serie } 
    });
  }

  crearCarga(fd: FormData) {
    console.log(fd);
    return this.http.post(`${this.base}/cargas`, fd, { headers: this.authHeaders() });
  }

  buscarEquipoPorNumero(numeco: string): Observable<EquipoDto> {
    return this.http.get<EquipoDto>(`${this.base}/equipos/numeco/${encodeURIComponent(numeco)}`,{
      headers: this.authHeaders()
    });
  }

  
}
