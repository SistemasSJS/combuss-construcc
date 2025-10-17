// equipos.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';

import { EquiposPageRoutingModule } from './equipos-routing.module';
import { EquiposPage } from './equipos.page';

// 👇 Tu modal NO-standalone (debe ir en declarations)
import { EquipoFormModalComponent } from 'src/app/modals/equipo-form-modal/equipo-form-modal.component';

// 👇 angularx-qrcode es standalone → va en imports
import { QRCodeComponent } from 'angularx-qrcode';

@NgModule({
  declarations: [
    EquiposPage,
    EquipoFormModalComponent,     // ✅ AQUÍ (declarations)
  ],
  imports: [
    HttpClientModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    IonicModule,
    EquiposPageRoutingModule,
    QRCodeComponent,              // ✅ AQUÍ (imports) porque ES standalone
  ],
})
export class EquiposPageModule {}
