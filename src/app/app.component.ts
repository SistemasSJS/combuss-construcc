import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Platform } from '@ionic/angular';
import { AuthService } from './services/auth.service';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  public appPages = [
    { title: 'Equipos', url: '/equipos', icon: 'construct' },
    { title: 'Cargas', url: '/cargas', icon: 'receipt' },
    
  ];
  public labels = [];

  isAuthRoute = false;
  private authRoutes = ['/login', '/register', '/auth/forgot'];

  constructor(
    private router: Router,
    private menu: MenuController,
    private auth: AuthService,
    private platform: Platform
  ) {
    // Monitorea cambios de login/logout
    this.auth.isLoggedIn$().subscribe((logged) => {
      const currentUrl = this.router.url;
      const isAuth = this.authRoutes.some(p => currentUrl.startsWith(p));
      const showMenu = logged && !isAuth;
      this.isAuthRoute = !showMenu;
      this.menu.enable(showMenu);
    });

    // También controla el menú según la ruta
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects || e.url;
        const isAuth = this.authRoutes.some(p => url.startsWith(p));
        this.isAuthRoute = isAuth;
        this.menu.enable(!isAuth);
      });
  }

  logout() {
    this.auth.logout();
    this.menu.close(); // cierra el menú si estaba abierto
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  get isDesktop(): boolean {
    return this.platform.is('desktop');
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin();
  }
}
