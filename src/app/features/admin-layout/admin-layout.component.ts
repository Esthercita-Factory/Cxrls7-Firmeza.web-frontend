import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { apiErrorMessage } from '../../core/utils/api-error';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  isCollapsed = this.readPreference('firmeza-navigation-collapsed') === 'true';
  isDarkMode = this.readPreference('firmeza-theme') === 'dark';
  logoutError = '';
  isLoggingOut = false;

  constructor() {
    this.applyTheme();
  }

  toggleNavigation(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('firmeza-navigation-collapsed', String(this.isCollapsed));
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('firmeza-theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    document.documentElement.dataset['theme'] = this.isDarkMode ? 'dark' : 'light';
  }

  private readPreference(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  logout(): void {
    this.logoutError = '';
    this.isLoggingOut = true;
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: (error: unknown) => {
        this.logoutError = apiErrorMessage(error, 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
        this.isLoggingOut = false;
      },
    });
  }
}
