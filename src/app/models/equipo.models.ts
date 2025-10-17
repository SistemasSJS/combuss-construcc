export interface Equipo {
  id?: number;
  numeco: string;
  nombre: string;
  tipo:number;
  placas: string;
  vigenciaplacas: string;
  poliza:string;
  vigenciapoliza:string;
  noserie: string;
  peso: number;
  ulthorometro: number;
  combustible: number;
  responsable: string;
  operador:string;
  estado:string;
  foto?: string;
  obra?: number;
  rango_inferior?: number;
  rango_superior?: number;
  unidad_rend?: number;
  id_operador?: number;
}


