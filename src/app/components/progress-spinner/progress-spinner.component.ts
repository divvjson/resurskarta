import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgressSpinnerService } from 'src/app/services/progress-spinner.service';

@Component({
  selector: 'app-progress-spinner',
  standalone: true,
  imports: [
		CommonModule,
		MatProgressSpinnerModule,
	],
  templateUrl: './progress-spinner.component.html',
  styleUrls: ['./progress-spinner.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressSpinnerComponent implements OnInit {
	public progressSpinnerService = inject(ProgressSpinnerService);

	ngOnInit() {
		this.progressSpinnerService.progressSpinnerValue$.next(0);
	}
}
