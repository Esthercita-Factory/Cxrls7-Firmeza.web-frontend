import { registerLocaleData } from '@angular/common';
import { bootstrapApplication } from '@angular/platform-browser';
import localeEsCo from '@angular/common/locales/es-CO';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

registerLocaleData(localeEsCo);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
