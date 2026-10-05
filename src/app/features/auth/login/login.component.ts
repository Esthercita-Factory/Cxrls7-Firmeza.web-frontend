import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin-auth.service';
import { apiErrorMessage } from '../../../core/utils/api-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  readonly authService = inject(AdminAuthService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  rememberMe = false;
  errorMessage = '';
  isSubmitting = false;

  constructor() {
    if (this.route.snapshot.queryParamMap.get('reason') === 'api') {
      this.errorMessage = 'No se pudo verificar la sesión. Comprueba que el backend esté disponible.';
    }
  }

  submit(): void {
    this.isSubmitting = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password, this.rememberMe).subscribe({
      next: () => this.router.navigateByUrl('/admin/dashboard'),
      error: (error: unknown) => {
        this.errorMessage = apiErrorMessage(
          error,
          'No se pudo iniciar sesión. Verifica que el backend esté disponible e inténtalo de nuevo.',
        );
        this.isSubmitting = false;
      },
    });
  }
}
