import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // ✅ esto es esencial
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { Equipo } from '../models/equipo.models';

export interface TipoEquipo {
  id: number;
  nombre: string;
}
export interface TipoCombustible {
  id: number;
  nombre: string;
}
export interface Operador {
  id: number;
  nombre: string;
}
export interface Unidad {
  id: number;
  nombre: string;
}
export interface Obras {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogoService {
  private baseUrl = 'https://apicons.ddns.net:8093/api'; // Cambia esto si tu backend tiene otra URL
  //private baseUrl = 'http://appconstruc.test/api'; // Cambia esto si tu backend tiene otra URL
  //private baseUrl = 'api'; // Cambia esto si tu backend tiene otra URL

  constructor(private http: HttpClient, private authService: AuthService) {}

  // Obtener todos los materiales
  getEquipos(): Observable<Equipo[]> {
    return this.http.get<Equipo[]>(
      `${this.baseUrl}/equipos`,
      this.authService.getAuthHeaders()
    );
  }

  // Obtener un material por ID
  getEquipo(id: number) {
    return this.http.get(
      `${this.baseUrl}/equipos/${id}`,
      this.authService.getAuthHeaders()
    );
  }

  // Crear un nuevo material
  createEquipo(data: any) {
    return this.http.post(
      `${this.baseUrl}/equipos`,
      data,
      this.authService.getAuthHeaders()
    );
  }

  // Actualizar un material
  updateEquipo(id: number, data: any) {
    return this.http.put(
      `${this.baseUrl}/equipos/${id}`,
      data,
      this.authService.getAuthHeaders()
    );
  }

  // Eliminar un material
  deleteEquipo(id: number) {
    return this.http.delete(
      `${this.baseUrl}/equipos/${id}`,
      this.authService.getAuthHeaders()
    );
  }

  getTiposEquipo(): Observable<TipoEquipo[]> {
    return this.http.get<TipoEquipo[]>(
      `${this.baseUrl}/tipo_equipos`,
      this.authService.getAuthHeaders()
    );
  }

  getCombustibles(): Observable<TipoCombustible[]> {
    return this.http.get<TipoCombustible[]>(
      `${this.baseUrl}/combustibles`,
      this.authService.getAuthHeaders()
    );
  }

  //Comienza el cambio
  getOperadores(): Observable<Operador[]> {
    return this.http.get<Operador[]>(
      `${this.baseUrl}/operadors`,
      this.authService.getAuthHeaders()
    );
  }

  getUnidades(): Observable<Unidad[]> {
    return this.http.get<Unidad[]>(
      `${this.baseUrl}/unidads`,
      this.authService.getAuthHeaders()
    );
  }

  uploadFoto(file: File): Observable<{ ruta: string }> {
    const formData = new FormData();
    formData.append('foto', file);

    return this.http.post<{ ruta: string }>(
      `${this.baseUrl}/upload-foto`,
      formData,
      this.authService.getAuthHeaders()
    );
  }

  getObras(): Observable<Obras[]> {
      return this.http.get<Obras[]>(
        `${this.baseUrl}/obras`,
        this.authService.getAuthHeaders()
      );
  }
}
