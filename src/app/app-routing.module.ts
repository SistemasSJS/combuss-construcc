import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'folder/:id',
    loadChildren: () => import('./folder/folder.module').then( m => m.FolderPageModule)
  },
  {
    path: 'equipos',
    loadChildren: () => import('./pages/catalogos/equipos/equipos.module').then( m => m.EquiposPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/auth/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'cargas',
    loadChildren: () => import('./pages/cargas/cargas.module').then( m => m.CargasPageModule)
  },
  {
    path: 'nueva-carga',
    loadChildren: () => import('./pages/nueva-carga/nueva-carga.module').then( m => m.NuevaCargaPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
