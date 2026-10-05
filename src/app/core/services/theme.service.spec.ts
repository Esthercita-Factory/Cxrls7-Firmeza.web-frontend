import { ThemeService, themeStorageKey } from './theme.service';

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.removeItem(themeStorageKey);
    delete document.documentElement.dataset['theme'];
  });

  it('restores and toggles the saved theme', () => {
    localStorage.setItem(themeStorageKey, 'dark');
    const theme = new ThemeService();

    expect(theme.isDarkMode()).toBeTrue();
    expect(document.documentElement.dataset['theme']).toBe('dark');

    theme.toggleTheme();

    expect(theme.isDarkMode()).toBeFalse();
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem(themeStorageKey)).toBe('light');
  });
});
