import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { DataService } from 'src/app/services/data.service';
import { Router } from '@angular/router';
import { ProgressSpinnerService } from 'src/app/services/progress-spinner.service';
import { combineLatest } from 'rxjs';

@Component({
	selector: 'app-home',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
	],
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
	public dataService = inject(DataService);
	private router = inject(Router);
	private progressSpinnerService = inject(ProgressSpinnerService);

	ngOnInit() {
		combineLatest([this.dataService.totalDownloaded$, this.dataService.totalSize$]).subscribe(([totalDownloaded, totalSize]) => {
			if (totalSize === null) return;
			const value = Math.round((totalDownloaded / totalSize) * 100);
			if (isNaN(value)) return;
			this.progressSpinnerService.progressSpinnerValue$.next(value);
			if (value === 100) {
				this.progressSpinnerService.showProgressSpinner$.next(false);
			}
		}); 
	}

	public load() {
		this.progressSpinnerService.showProgressSpinner$.next(true);
		this.dataService.load();
	}

	public start() {
		this.router.navigate(['map']);
	}
}
