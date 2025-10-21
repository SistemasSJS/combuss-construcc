import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  public appPages = [
    { title: 'Equipos', url: '/equipos', icon: 'construct' },
    { title: 'Cargas', url: '/cargas', icon: 'construct' },
  ];
  public labels = [];
  // ⇩ estado para ocultar el menú en rutas de auth
  isAuthRoute = false;
  // ajusta esta lista a tus rutas de autenticación
  private authRoutes = ['/login', '/register', '/auth/forgot'];

  constructor(private router: Router, private menu: MenuController) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        this.isAuthRoute = this.authRoutes.some(p => url.startsWith(p));
        // Deshabilita/rehabilita el menú para bloquear también el gesto
        this.menu.enable(!this.isAuthRoute);
      });
  }
}