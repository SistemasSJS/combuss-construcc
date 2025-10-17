import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

import { IonicModule } from '@ionic/angular';

import { NuevaCargaPageRoutingModule } from './nueva-carga-routing.module';

import { NuevaCargaPage } from './nueva-carga.page';

import { QRCodeComponent  } from 'angularx-qrcode';

@NgModule({
  imports: [
    CommonModule,
    ZXingScannerModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    NuevaCargaPageRoutingModule,
    QRCodeComponent   
  ],
  exports: [NuevaCargaPage],
  declarations: [NuevaCargaPage]
})
export class NuevaCargaPageModule {}
