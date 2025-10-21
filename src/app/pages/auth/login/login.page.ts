import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  doLogin() {
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        alert('Login exitoso ✅');
        this.router.navigate(['/equipos'], { replaceUrl: true });
      },
      error: err => {
        console.error(err);
        this.error = 'Credenciales incorrectas';
      }
    });
  }
}
