import { Injectable, signal } from '@angular/core';

export const themeStorageKey = 'firmeza-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDarkMode = signal(this.readPreference() === 'dark');

  constructor() {
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkMode.update((isDark) => !isDark);
    this.applyTheme();
  }

  private applyTheme(): void {
    const theme = this.isDarkMode() ? 'dark' : 'light';
    document.documentElement.dataset['theme'] = theme;
    localStorage.setItem(themeStorageKey, theme);
  }

  private readPreference(): string | null {
    try {
      return localStorage.getItem(themeStorageKey);
    } catch {
      return null;
    }
  }
}
