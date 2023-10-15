import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SpinnerService } from './services/spinner.service';
import { ProgressSpinnerComponent } from './components/progress-spinner/progress-spinner.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { ProgressSpinnerService } from './services/progress-spinner.service';
import sv from '@angular/common/locales/sv';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
		CommonModule,
		ProgressSpinnerComponent,
		RouterOutlet,
		SpinnerComponent,
	],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
	public progressSpinnerService = inject(ProgressSpinnerService);
	public spinnerService = inject(SpinnerService);

	constructor() {
		registerLocaleData(sv);
	}
}
