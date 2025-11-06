import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
//import { EquipoFormModalComponent } from './modals/equipo-form-modal/equipo-form-modal.component';
import { CUSTOM_ELEMENTS_SCHEMA, isDevMode } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserPrintService } from './services/browser-print.service';
import { provideCharts, withDefaultRegisterables, BaseChartDirective } from 'ng2-charts';
import { ServiceWorkerModule } from '@angular/service-worker';


export function initBP(bp: BrowserPrintService) {
  // Si no quieres bloquear el arranque, captura el error y resuelve igual.
  return () => bp.ensureReady().catch(() => {});
}

@NgModule({
  declarations: [AppComponent, /*EquipoFormModalComponent*/],
  imports: [BrowserModule, IonicModule.forRoot(),  AppRoutingModule, HttpClientModule, ReactiveFormsModule, ServiceWorkerModule.register('ngsw-worker.js', {
  enabled: !isDevMode(),
  // Register the ServiceWorker as soon as the application is stable
  // or after 30 seconds (whichever comes first).
  registrationStrategy: 'registerWhenStable:30000'
})],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [BrowserPrintService,{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, provideCharts(withDefaultRegisterables())],
  bootstrap: [AppComponent],
  
})

export class AppModule {}
