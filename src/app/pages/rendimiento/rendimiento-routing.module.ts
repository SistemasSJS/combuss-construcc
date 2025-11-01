import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RendimientoPage } from './rendimiento.page';

const routes: Routes = [
  {
    path: '',
    component: RendimientoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RendimientoPageRoutingModule {}
