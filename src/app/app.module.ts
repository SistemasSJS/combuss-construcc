import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
//import { EquipoFormModalComponent } from './modals/equipo-form-modal/equipo-form-modal.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserPrintService } from './services/browser-print.service';

export function initBP(bp: BrowserPrintService) {
  // Si no quieres bloquear el arranque, captura el error y resuelve igual.
  return () => bp.ensureReady().catch(() => {});
}

@NgModule({
  declarations: [AppComponent, /*EquipoFormModalComponent*/],
  imports: [BrowserModule, IonicModule.forRoot(),  AppRoutingModule, HttpClientModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [BrowserPrintService,{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
  
})

export class AppModule {}
