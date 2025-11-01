import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RendimientoPageRoutingModule } from './rendimiento-routing.module';

import { RendimientoPage } from './rendimiento.page';

import { BaseChartDirective } from 'ng2-charts';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BaseChartDirective,
    RendimientoPageRoutingModule
  ],
  declarations: [RendimientoPage]
})
export class RendimientoPageModule {}
