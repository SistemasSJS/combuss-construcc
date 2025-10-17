import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
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
  constructor() {}
}
