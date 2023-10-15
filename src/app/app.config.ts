import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withJsonpSupport } from '@angular/common/http';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(routes),
		provideAnimations(),
		provideHttpClient(
			withJsonpSupport()
		),
		{
			provide: LocationStrategy,
			useClass: HashLocationStrategy,
		},
		{
			provide: LOCALE_ID,
			useValue: 'sv-SE',
		},
		{ 
			provide: MAT_ICON_DEFAULT_OPTIONS, 
			useValue: { fontSet: 'material-icons-outlined' },
		}
	]
};
