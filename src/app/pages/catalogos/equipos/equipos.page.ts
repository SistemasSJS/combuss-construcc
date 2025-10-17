import { Component, OnInit } from '@angular/core';
import { CatalogoService } from 'src/app/services/catalogo.service';
import { EquipoFormModalComponent } from '../../../modals/equipo-form-modal/equipo-form-modal.component';
import {
  AlertController,
  ModalController,
  ToastController,
} from '@ionic/angular';

@Component({
  selector: 'app-equipos',
  templateUrl: './equipos.page.html',
  styleUrls: ['./equipos.page.scss'],
  standalone: false,
})
export class EquiposPage implements OnInit {
  equipos: any[] = [];
  imagenBaseUrl = 'https://apicons.ddns.net:8093'; // sin /api
  //imagenBaseUrl = 'http://appconstruc.test'; // sin /api
  //imagenBaseUrl = 'http://192.168.1.83:8000'; // sin /api


  constructor(
    private catalogoService: CatalogoService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  cargarEquipos() {
    this.catalogoService.getEquipos().subscribe((data) => {
      this.equipos = data;
    });
  }

  ngOnInit() {
    this.catalogoService.getEquipos().subscribe((data: any) => {
      this.equipos = data;
    });
  }

  editar(eq: any) {
    // lógica para editar
    console.log('Editar:', eq);
  }

  async eliminar(id: number) {
    const alert = await this.alertCtrl.create({
      header: '¿Eliminar equipo?',
      message: 'Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.catalogoService.deleteEquipo(id).subscribe({
              next: () => {
                this.cargarEquipos();
                this.mostrarToast('Equipo eliminado correctamente', 'success');
              },
              error: (err) => {
                console.error('Error al eliminar:', err);
                this.mostrarToast('Error al eliminar el equipo', 'danger');
              },
            });
          },
        },
      ],
    });

    await alert.present();
  }

  async abrirModal(equipo: any = null) {
    const modal = await this.modalCtrl.create({
      component: EquipoFormModalComponent,
      componentProps: { equipo },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    
    if (data) {
      if (equipo) {
        // Editar
        this.catalogoService.updateEquipo(data.id, data).subscribe({
          next: () => {
            this.cargarEquipos();
            this.mostrarToast('Equipo actualizado correctamente');
          },
          error: () => {
            this.mostrarToast('Error al actualizar equipo', 'danger');
          },
        });
      } else {
        // Crear nuevo
        this.catalogoService.createEquipo(data).subscribe({
          next: () => {
            this.cargarEquipos();
            this.mostrarToast('Equipo creado correctamente');
          },
          error: () => {
            this.mostrarToast('Error al crear equipo', 'danger');
          },
        });
      }
    }
  }

  async mostrarToast(mensaje: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      color,
      position: 'bottom',
    });
    toast.present();
  }
}
