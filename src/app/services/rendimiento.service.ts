// src/app/services/rendimiento.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface RendItem {
  fecha_carga: string;
  litros: number;
  medidor_prev: number|null;
  medidor_act: number|null;
  distancia_o_horas: number|null;
  eficiencia: number|null; // km/L o h/L
  unidad: 'km/L'|'h/L';
  estado: 'bajo'|'en_rango'|'alto'|null;
  carga_id: number;
}

export interface RendResponse {
  equipo_id: number;
  unidad: 'km/L'|'h/L';
  rango_objetivo?: { inferior: number|null; superior: number|null } | null;
  items: RendItem[];
  resumen: {
    promedio: number|null;
    min: number|null;
    max: number|null;
    porcentaje_en_rango: number;
    tendencia: number|null;
    total_registros: number;
  }|null;
}

@Injectable({ providedIn: 'root' })
export class RendimientoService {
  private base = 'https://apicons.ddns.net:8093/api';
  //private base = '/api'; // ajusta si usas proxy o ruta distinta

  constructor(private http: HttpClient) {}

  getRendimiento(equipoId: number) {
    return this.http.get<RendResponse>(`${this.base}/equipos/${equipoId}/rendimiento`, this.getReporteHeaders());
    // TIP: puedes enviar el equipoId tras escanear el QR
  }
  
  getReporteHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      })
    };
  }
  
}
