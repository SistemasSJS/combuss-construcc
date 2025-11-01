import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { CatalogoService } from '../../services/catalogo.service';
import { Equipo } from '../../models/equipo.models';
import {
  RendimientoService,
  RendResponse,
} from '../../services/rendimiento.service';

@Component({
  selector: 'app-rendimiento',
  templateUrl: './rendimiento.page.html',
  styleUrls: ['./rendimiento.page.scss'],
  standalone: false,
})
export class RendimientoPage implements OnInit {
  equipos: Equipo[] = [];
  equipoId?: number;

  data?: RendResponse;
  loading = false;
  error?: string;

  // sparkline
  viewW = 200;
  viewH = 40;
  sparkPath = '';

  spark: {
    segments: Array<{ d: string; color: string }>;
    points: Array<{ cx: number; cy: number; color: string; label: string }>;
    infY: number | null;
    supY: number | null;
  } | null = null;

  trackByCargaId = (_: number, it: any) => it.carga_id ?? it.fecha_carga ?? _;

  constructor(
    private route: ActivatedRoute,
    private equiposSrv: CatalogoService,
    private rendSrv: RendimientoService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    // 1) Carga lista de equipos para el select
    this.equiposSrv.getEquipos().subscribe({
      next: (list) => {
        this.equipos = list;
        // 2) Si la ruta trae :equipoId, precarga
        const raw = this.route.snapshot.paramMap.get('equipoId');
        const id = raw ? Number(raw) : NaN;
        if (!Number.isNaN(id) && id > 0) {
          this.equipoId = id;
          this.cargar();
        }
      },
      error: () =>
        this.toast('No fue posible cargar la lista de equipos', 'danger'),
    });
  }

  onEquipoChange() {
    if (this.equipoId && this.equipoId > 0) {
      this.cargar();
    } else {
      this.data = undefined;
    }
  }

  private cargar() {
    if (!this.equipoId) return;
    this.loading = true;
    this.error = undefined;
    this.data = undefined;

    this.rendSrv.getRendimiento(this.equipoId).subscribe({
      next: (res) => {
        this.data = res;

        //this.sparkPath = this.buildSparkline(res);
        this.spark = this.buildSpark(res);

        this.loading = false;
      },
      error: () => {
        this.error = 'No fue posible cargar el reporte.';
        this.loading = false;
        this.toast('No fue posible cargar el reporte', 'danger');
      },
    });
  }

  private buildSparkline(res: RendResponse): string {
    const vals = res.items.map((i) => i.eficiencia ?? 0);
    if (!vals.length) return '';

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    const step = this.viewW / Math.max(vals.length - 1, 1);

    return vals
      .map((v, idx) => {
        const x = idx * step;
        const y = this.viewH - ((v - min) / range) * this.viewH;
        return `${idx === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  // Color por estado
  private colorPorEstado(estado?: string): string {
    switch (estado) {
      case 'en_rango':
        return '#22c55e'; // verde
      case 'bajo':
        return '#ef4444'; // rojo
      case 'alto':
        return '#60a5fa'; // azul
      default:
        return '#a3a3a3'; // gris
    }
  }

  // mapear valor -> coordenada Y del SVG
  private mapY(v: number, min: number, max: number): number {
    const range = max - min || 1;
    return this.viewH - ((v - min) / range) * this.viewH;
  }

  // Construye segmentos coloreados + puntos + líneas de rango
  private buildSpark(res: RendResponse) {
    const items = res && res.items ? res.items : [];
    if (!items.length) return null;

    const vals = items.map((i: any) => i.eficiencia ?? 0);
    const estados = items.map((i: any) => i.estado ?? null);

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const step = this.viewW / Math.max(vals.length - 1, 1);

    const segments: Array<{ d: string; color: string }> = [];
    const points: Array<{
      cx: number;
      cy: number;
      color: string;
      label: string;
    }> = [];

    // puntos
    for (let i = 0; i < vals.length; i++) {
      const x = i * step;
      const y = this.mapY(vals[i], min, max);
      points.push({
        cx: +x.toFixed(1),
        cy: +y.toFixed(1),
        color: this.colorPorEstado(estados[i] ?? undefined),
        label: `${(vals[i] ?? 0).toFixed(2)} ${res.unidad || ''} · ${
          estados[i] ?? '—'
        }`,
      });
    }

    // segmentos (coloreados por el "destino")
    for (let i = 0; i < vals.length - 1; i++) {
      const x1 = i * step;
      const y1 = this.mapY(vals[i], min, max);
      const x2 = (i + 1) * step;
      const y2 = this.mapY(vals[i + 1], min, max);

      segments.push({
        d: `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(
          1
        )}`,
        color: this.colorPorEstado(estados[i + 1] ?? undefined),
      });
    }

    // líneas de rango (si existen)
    const inf = Number((res as any)?.rango_objetivo?.inferior);
    const sup = Number((res as any)?.rango_objetivo?.superior);

    const infY = Number.isFinite(inf) ? this.mapY(inf, min, max) : null;
    const supY = Number.isFinite(sup) ? this.mapY(sup, min, max) : null;

    return { segments, points, infY, supY };
  }

  tendenciaIcon(t?: number | null) {
    if (t === null || t === undefined) return 'remove';
    return t > 0 ? 'trending-up' : t < 0 ? 'trending-down' : 'remove';
  }

  badgeColor(estado: RendResponse['items'][0]['estado']) {
    switch (estado) {
      case 'en_rango':
        return 'success';
      case 'alto':
        return 'tertiary';
      case 'bajo':
        return 'danger';
      default:
        return 'medium';
    }
  }

  private async toast(
    message: string,
    color: 'success' | 'warning' | 'danger' | 'medium' | 'tertiary' = 'success'
  ) {
    const t = await this.toastCtrl.create({ message, duration: 2200, color });
    await t.present();
  }
}
