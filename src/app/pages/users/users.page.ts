import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { IonModal, ToastController } from '@ionic/angular';
import { UsersService } from '../../services/users.service';

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  standalone: false,
})
export class UsersPage implements OnInit {
  @ViewChild('createModal') createModal!: IonModal;
  @ViewChild('editModal') editModal!: IonModal;

  users: User[] = [];
  loading = false;

  // usuario en edición
  editing: User | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: [''], // requerido solo en create
    role: [''],
  });

  constructor(
    private fb: FormBuilder,
    private usersSvc: UsersService,
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
    this.usersSvc.list().subscribe({
      next: (res) => this.users = res,
      error: () => this.toast('Error al cargar usuarios', 'danger'),
      complete: () => this.loading = false,
    });
  }

  // Crear
  openCreate() {
    this.editing = null;
    this.form.reset();
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.get('password')?.updateValueAndValidity();
    this.createModal.present();
  }

  saveCreate() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const payload = {
      name: v.name!,
      email: v.email!,
      password: v.password!, // requerido en create
      role: v.role || undefined,
    };
    this.usersSvc.create(payload).subscribe({
      next: () => {
        this.createModal.dismiss();
        this.toast('Usuario creado', 'success');
        this.load();
      },
      error: (err) => {
        this.toast('Error al crear usuario', 'danger');
        console.error(err);
      }
    });
  }

  // Editar
  openEdit(u: User) {
    this.editing = u;
    this.form.reset({
      name: u.name,
      email: u.email,
      role: u.role ?? '',
      password: '',
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.editModal.present();
  }

  saveEdit() {
    if (!this.editing) return;
    if (this.form.invalid) return;
    const v = this.form.value;

    const payload: any = {
      name: v.name!,
      email: v.email!,
      role: v.role || undefined,
    };
    if (v.password) payload.password = v.password;

    this.usersSvc.update(this.editing.id, payload).subscribe({
      next: () => {
        this.editModal.dismiss();
        this.toast('Usuario actualizado', 'success');
        this.load();
      },
      error: (err) => {
        this.toast('Error al actualizar', 'danger');
        console.error(err);
      }
    });
  }

  // Eliminar
  remove(u: User) {
    if (!confirm(`¿Eliminar a ${u.name}?`)) return;
    this.usersSvc.delete(u.id).subscribe({
      next: () => {
        this.toast('Usuario eliminado', 'success');
        this.load();
      },
      error: (err) => {
        this.toast('Error al eliminar', 'danger');
        console.error(err);
      }
    });
  }
}
