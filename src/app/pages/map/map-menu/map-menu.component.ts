import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MapService } from '../map.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ItemPickerDialogInput } from 'src/app/components/item-picker-dialog/item-picker-dialog-input';
import { ItemPickerDialogComponent } from 'src/app/components/item-picker-dialog/item-picker-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { Resurser } from 'src/app/entities/Resurser';
import { DataService } from 'src/app/services/data.service';
import { Resurskategorier } from 'src/app/entities/Resurskategorier';
import { Fordonskategorier } from 'src/app/entities/Fordonskategorier';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { A11yModule } from '@angular/cdk/a11y';

@UntilDestroy()
@Component({
	selector: 'app-map-menu',
	standalone: true,
	imports: [
		A11yModule,
		CommonModule,
		MatButtonModule,
		MatCheckboxModule,
		MatChipsModule,
		MatDialogModule,
		MatDividerModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatMenuModule,
		MatSnackBarModule,
		ReactiveFormsModule,
	],
	templateUrl: './map-menu.component.html',
	styleUrls: ['./map-menu.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapMenuComponent {
	public mapService = inject(MapService);
	private dialog = inject(MatDialog);
	private dataService = inject(DataService);
	private snackBar = inject(MatSnackBar);
	public findResursFormControl = new FormControl('');
	public resursChips: Resurser[] = [];

	public findResurs() {
		const value = this.findResursFormControl.value;

		if (value === null) return;

		const resurs = this.dataService
			.getResurser()
			.filter(resurs => resurs.fkFordonNavigation?.regnr?.toUpperCase() === value.toUpperCase())
			.at(0);

		if (resurs === undefined) {
			this.snackBar.open('Ingen träff', 'OK', { duration: 2500 });
			return;
		}

		if (this.resursChips.find(resursChip => resursChip.pk === resurs.pk) === undefined) {
			this.resursChips.push(resurs);
		}

		const prev = this.mapService.getFocusedResurs().current;
		this.mapService.setFocusedResurs({ prev: prev, current: resurs });

		this.findResursFormControl.setValue('');
	}

	public handleResursChipClicked(resursClicked: Resurser) {
		const toggleOperation = resursClicked.pk === this.mapService.getFocusedResurs().current?.pk;

		if (toggleOperation) {
			this.mapService.setFocusedResurs({ prev: resursClicked, current: null });
			return;
		}

		this.mapService.setFocusedResurs({
			prev: this.mapService.getFocusedResurs().current,
			current: resursClicked,
		});
	}

	public removeResursChip(resursToRemove: Resurser) {
		if (resursToRemove.pk === this.mapService.getFocusedResurs().current?.pk) {
			this.mapService.setFocusedResurs({ prev: resursToRemove, current: null });
		}

		const index = this.resursChips.findIndex(resurs => resurs.pk === resursToRemove.pk);

		this.resursChips.splice(index, 1);
	}

	public openResursPicker() {
		const dialogConfig: MatDialogConfig<ItemPickerDialogInput> = {
			disableClose: true,
			data: {
				initiallySelectedItemPks: this.mapService.getMapFilter().resursPks,
				identityColumn: 'fkFordonNavigation.regnr',
				columns: [
					'checkbox',
					'fkFordonNavigation.regnr',
					'fkFordonNavigation.fkKunderNavigation.kundNamn',
					'fkChaufforerNavigation.chaufforNamn'
				],
				headers: ['', 'Regnr', 'Åkeri', 'Chaufför'],
				title: 'Resurser',
				dataSource: this.dataService.getResurser(),
			},
		};

		this.dialog
			.open(ItemPickerDialogComponent, dialogConfig)
			.afterClosed()
			.pipe(untilDestroyed(this))
			.subscribe((selectedResurser: Resurser[]) => {
				const mapFilter = this.mapService.getMapFilter();
				mapFilter.resursPks = selectedResurser.map(resurs => resurs.pk);
				this.mapService.setMapFilter(mapFilter);
			});
	}

	public openResurskategorierPicker() {
		const dialogConfig: MatDialogConfig<ItemPickerDialogInput> = {
			disableClose: true,
			width: '1024px',
			maxWidth: '90vw',
			maxHeight: '90vh',
			data: {
				initiallySelectedItemPks: this.mapService.getMapFilter().resurskategoriPks,
				identityColumn: 'resurskategoriNamn',
				columns: [
					'checkbox',
					'resurskategoriNamn',
					'fkVerksamheterNavigation.verksamhetNamn',
				],
				headers: ['', 'Resurskategori', 'Verksamhet'],
				title: 'Resurskategorier',
				dataSource: this.dataService.getResurskategorier(),
			},
		};

		this.dialog
			.open(ItemPickerDialogComponent, dialogConfig)
			.afterClosed()
			.pipe(untilDestroyed(this))
			.subscribe((selectedResurskategorier: Resurskategorier[]) => {
				const mapFilter = this.mapService.getMapFilter();
				mapFilter.resurskategoriPks = selectedResurskategorier.map(resurskategori => resurskategori.pk);
				this.mapService.setMapFilter(mapFilter);
			});
	}

	public openFordonskategorierPicker() {
		const dialogConfig: MatDialogConfig<ItemPickerDialogInput> = {
			disableClose: true,
			width: '1024px',
			maxWidth: '90vw',
			maxHeight: '90vh',
			data: {
				initiallySelectedItemPks: this.mapService.getMapFilter().fordonskategoriPks,
				identityColumn: 'fordonskategoriNamn',
				columns: [
					'checkbox',
					'fordonskategoriNamn',
				],
				headers: ['', 'Fordonskategori'],
				title: 'Fordonskategorier',
				dataSource: this.dataService.getFordonskategorier(),
			},
		};

		this.dialog
			.open(ItemPickerDialogComponent, dialogConfig)
			.afterClosed()
			.pipe(untilDestroyed(this))
			.subscribe((selectedFordonskategorier: Fordonskategorier[]) => {
				const mapFilter = this.mapService.getMapFilter();
				mapFilter.fordonskategoriPks = selectedFordonskategorier.map(fordonskategori => fordonskategori.pk);
				this.mapService.setMapFilter(mapFilter);
			});
	}

	public toggleShowOnlyActive() {
		const mapFilter = this.mapService.getMapFilter();
		mapFilter.showOnlyActive = !mapFilter.showOnlyActive;
		this.mapService.setMapFilter(mapFilter);
	}

	public handleFileSelected(event: Event) {
		const element = event.target as HTMLInputElement | null;
		if (!element?.files) return;
		const file = element.files[0];
		this.mapService.importMapFilter(file);
	}
}
