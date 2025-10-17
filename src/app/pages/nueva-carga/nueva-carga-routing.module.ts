import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NuevaCargaPage } from './nueva-carga.page';

const routes: Routes = [
  {
    path: '',
    component: NuevaCargaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NuevaCargaPageRoutingModule {}
