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

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  doLogin() {
  this.error = '';

  this.authService.login({ email: this.email, password: this.password }).subscribe({
    next: (response: any) => {
      const token = response.token;

      if (token) {
        localStorage.setItem('token', token);
        alert('Login exitoso ✅');
        // Aquí podrías navegar a otra página, por ejemplo:
         this.router.navigate(['/equipos']);
      } else {
        this.error = 'No se recibió token';
      }
    },
    error: err => {
      console.error(err);
      this.error = 'Credenciales incorrectas';
    }
  });

  
}

}
