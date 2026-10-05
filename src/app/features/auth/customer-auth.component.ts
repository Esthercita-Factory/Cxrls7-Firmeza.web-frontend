import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { apiErrorMessage } from '../../core/utils/api-error';
import { CustomerRegistration } from '../../core/models/customer.models';

@Component({
  selector: 'app-customer-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-auth.component.html',
  styleUrl: './customer-auth.component.scss',
})
export class CustomerAuthComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly theme = inject(ThemeService);

  readonly mode: 'login' | 'register' =
    this.route.snapshot.data['mode'] === 'register' ? 'register' : 'login';
  email = '';
  password = '';
  confirmPassword = '';
  firstName = '';
  lastName = '';
  documentType = 'Cédula';
  documentNumber = '';
  phone = '';
  errorMessage = '';
  isSubmitting = false;

  submit(form: NgForm): void {
    this.errorMessage = '';
    if (form.invalid) {
      form.control.markAllAsTouched();
      this.errorMessage = 'Completa los campos obligatorios. La contraseña debe tener al menos 10 caracteres.';
      return;
    }
    if (this.mode === 'register' && this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.isSubmitting = true;

    if (this.mode === 'login') {
      this.auth.login(this.email.trim(), this.password).subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const safeReturnUrl = returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
            ? returnUrl
            : '/';
          void this.router.navigateByUrl(safeReturnUrl);
        },
        error: (error: unknown) => this.handleError(error),
      });
      return;
    }

    const registration: CustomerRegistration = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      documentType: this.documentType,
      documentNumber: this.documentNumber.trim(),
      email: this.email.trim(),
      phone: this.phone.trim() || null,
      password: this.password,
      confirmPassword: this.confirmPassword,
    };
    this.auth.register(registration).pipe(
      switchMap((result) =>
        this.auth.login(registration.email, registration.password).pipe(
          map((user) => ({
            user,
            registrationEmailSent: result.registrationEmailSent,
          })),
        ),
      ),
    ).subscribe({
      next: ({ registrationEmailSent }) => void this.router.navigate(['/'], {
        queryParams: { welcome: 'true', registrationEmailSent },
      }),
      error: (error: unknown) => this.handleError(error),
    });
  }

  private handleError(error: unknown): void {
    this.errorMessage = apiErrorMessage(
      error,
      'No pudimos completar la solicitud. Revisa tus datos e inténtalo nuevamente.',
    );
    this.isSubmitting = false;
  }
}
