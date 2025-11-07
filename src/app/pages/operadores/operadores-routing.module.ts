import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OperadoresPage } from './operadores.page';

const routes: Routes = [
  {
    path: '',
    component: OperadoresPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OperadoresPageRoutingModule {}
