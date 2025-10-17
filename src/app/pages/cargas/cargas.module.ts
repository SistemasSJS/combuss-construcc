import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CargasPageRoutingModule } from './cargas-routing.module';

import { CargasPage } from './cargas.page';
import { NuevaCargaPageModule } from '../nueva-carga/nueva-carga.module'; // para usar el modal

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CargasPageRoutingModule,
    NuevaCargaPageModule, // << importante para poder abrir el modal
  ],
  declarations: [CargasPage],
})
export class CargasPageModule {}
