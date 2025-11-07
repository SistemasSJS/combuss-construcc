import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { IonModal, ToastController } from '@ionic/angular';
import { OperadorService } from '../../services/operadores.service';

export interface Operador {
  id: number;
  nombre: string;
  activo: string;
}

@Component({
  selector: 'app-operadores',
  templateUrl: './operadores.page.html',
  styleUrls: ['./operadores.page.scss'],
  standalone: false,
})
export class OperadoresPage implements OnInit {
  @ViewChild('createModal') createModal!: IonModal;
  @ViewChild('editModal') editModal!: IonModal;

  operador: Operador[] = [];
  loading = false;

  // usuario en edición
  editing: Operador | null = null;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(255)]],
    activo: ['', [Validators.required, Validators.maxLength(255)]],
  });

  constructor(
    private fb: FormBuilder,
    private operadorSvc: OperadorService,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.load();
  }

  async toast(message: string, color: 'success'|'warning'|'danger'|'primary' = 'primary') {
    const t = await this.toastCtrl.create({ message, duration: 2000, color });
    await t.present();
  }

  load() {
    this.loading = true;
    this.operadorSvc.list().subscribe({
      next: (res) => this.operador = res,
      error: () => this.toast('Error al cargar operadores', 'danger'),
      complete: () => this.loading = false,
    });
  }

  // Crear
  openCreate() {
    this.editing = null;
    this.form.reset();
    this.createModal.present();
  }

  saveCreate() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload = {
      nombre: v.nombre!,
      activo: v.activo!,
    };
    this.operadorSvc.create(payload).subscribe({
      next: () => {
        this.createModal.dismiss();
        this.toast('Operador creado', 'success');
        this.load();
      },
      error: (err) => {
        this.toast('Error al crear operador', 'danger');
        console.error(err);
      }
    });
  }

  // Editar
  openEdit(o: Operador) {
    this.editing = o;
    this.form.reset({
      nombre: o.nombre,
      activo: o.activo,
    });
    this.editModal.present();
  }

  saveEdit() {
    if (!this.editing) return;
    if (this.form.invalid) return;
    const v = this.form.value;

    const payload: any = {
      nombre: v.nombre!,
      activo: v.activo!,
    };
    

    this.operadorSvc.update(this.editing.id, payload).subscribe({
      next: () => {
        this.editModal.dismiss();
        this.toast('Operador actualizado', 'success');
        this.load();
      },
      error: (err) => {
        this.toast('Error al actualizar', 'danger');
        console.error(err);
      }
    });
  }

  // Eliminar
  remove(o: Operador) {
    if (!confirm(`¿Eliminar a ${o.nombre}?`)) return;
    this.operadorSvc.delete(o.id).subscribe({
      next: () => {
        this.toast('Operador eliminado', 'success');
        this.load();
      },
      error: (err) => {
        this.toast('Error al eliminar', 'danger');
        console.error(err);
      }
    });
  }
}
