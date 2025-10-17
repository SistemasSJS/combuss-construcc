// src/app/pages/cargas/cargas.page.ts
import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
//import { format } from 'date-fns';
import { CargasService } from '../../services/cargas.service';
import { NuevaCargaPage } from '../nueva-carga/nueva-carga.page';

@Component({
  selector: 'app-cargas',
  templateUrl: './cargas.page.html',
  standalone: false,
})
export class CargasPage implements OnInit {
  //selectedMonth = format(new Date(), 'yyyy-MM'); // YYYY-MM
  //selectedMonth: string = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  selectedMonth: string = this.formatMonth(new Date().toISOString());

  items: any[] = [];
  loading = false;
  page = 1;
  meta?: { total: number; per_page: number; page: number };

  constructor(private api: CargasService, private modalCtrl: ModalController) {}

  ngOnInit() {
    this.load();
  }

  load(reset = true) {
    if (reset) {
      this.page = 1;
      this.items = [];
    }
    this.loading = true;
    console.log('📤 Enviando mes al backend:', this.selectedMonth);

    // ahora selectedMonth ya está en formato "YYYYMM"
    this.api.listByMonth(this.selectedMonth, this.page).subscribe({
      next: (res) => {
        this.items = reset ? res.data : this.items.concat(res.data);
        this.meta = res.meta;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // convierte "YYYY-MM" o "YYYY-MM-DD..." a "YYYYMM"
  private formatMonth(value: string): string {
    return value.slice(0, 7).replace('-', ''); // "2025-08" -> "202508"
  }

  onMonthChange(ev: any) {
    const v: string = ev.detail.value; // "2025-08" o "2025-08-01T00:00:00Z"
    this.selectedMonth = this.formatMonth(v); // lo convertimos a "YYYYMM"
    this.load(true);
  }

  loadMore(ev: any) {
    if (!this.meta) {
      ev.target.complete();
      return;
    }
    const totalPages = Math.ceil(this.meta.total / this.meta.per_page);
    this.page++;
    if (this.page <= totalPages) {
      this.load(false);
    }
    ev.target.complete();
  }

  async abrirNueva() {
    const modal = await this.modalCtrl.create({
      component: NuevaCargaPage,
      breakpoints: [0, 0.9],
      initialBreakpoint: 0.9,
      componentProps: {
        serieFija: 'CA', // <- ajusta tu serie por defecto
      },
    });
    await modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'saved') this.load(true); // refrescar lista
  }
}
