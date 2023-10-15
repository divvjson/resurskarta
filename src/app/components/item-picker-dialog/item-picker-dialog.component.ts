import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pk } from 'src/app/interfaces/pk';
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ItemPickerDialogInput } from './item-picker-dialog-input';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Resurser } from 'src/app/entities/Resurser';
import { combineLatest, debounceTime } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Resurskategorier } from 'src/app/entities/Resurskategorier';
import { distinct } from 'src/app/functions/distinct.function';
import { Fordonskategorier } from 'src/app/entities/Fordonskategorier';
import { BreakpointService } from 'src/app/services/breakpoint.service';
import { findFirstParentWithClass } from 'src/app/functions/find-first-parent-with-class.function';
import { MatChipsModule } from '@angular/material/chips';

@UntilDestroy()
@Component({
	selector: 'app-item-picker-dialog',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatCheckboxModule,
		MatChipsModule,
		MatFormFieldModule,
		MatIconModule,
		MatInputModule,
		MatPaginatorModule,
		MatTableModule,
		ReactiveFormsModule,
	],
	templateUrl: './item-picker-dialog.component.html',
	styleUrls: ['./item-picker-dialog.component.scss'],
})
export class ItemPickerDialogComponent implements OnInit, AfterViewInit {
	public isSearching = false;
	public searchFilterFormControl = new FormControl('');
	public skip = 0;
	public take = 10;
	public count = 0;
	public selectedItems: Pk[] = [];
	public items: Pk[] = [];
	@ViewChild(MatPaginator) public paginator!: MatPaginator;
	private dialogRef = inject(MatDialogRef<ItemPickerDialogComponent>);
	private breakpointService = inject(BreakpointService);
	private elementRef = inject(ElementRef);

	constructor(@Inject(MAT_DIALOG_DATA) public input: ItemPickerDialogInput) { }

	ngOnInit() {
		this.addRows();
		this.selectedItems = [...this.input.dataSource.filter(item => this.input.initiallySelectedItemPks.includes(item.pk))];
		this.search();
	}

	ngAfterViewInit() {
		this.handleViewportSizeChanged();
		this.handleSearchFilterChanged();
		this.handlePageChanged();
	}

	private async search() {
		this.isSearching = true;
		let items: Pk[] = [];
		const type = distinct(this.input.dataSource.map(pk => pk.type)).at(0);
		if (type === undefined) throw new Error('No type');
		const searchFilter = this.searchFilterFormControl.value ?? '';

		switch (type) {
			case 'Fordonskategorier':
				const fordonskategorier = this.input.dataSource as Fordonskategorier[];
				items = fordonskategorier.filter(fordonskategori =>
					fordonskategori.fordonskategoriNamn.toLowerCase().includes(searchFilter.toLowerCase()));
				this.count = items.length;
				this.items = items.slice(this.skip, this.skip + this.take);
				break;
			case 'Resurser':
				const resurser = this.input.dataSource as Resurser[];
				items = resurser.filter(resurs =>
					resurs.fkFordonNavigation?.regnr?.toLowerCase().includes(searchFilter.toLowerCase()) ||
					resurs.fkFordonNavigation?.fkKunderNavigation?.kundNamn.toLowerCase().includes(searchFilter.toLowerCase()) ||
					resurs.fkChaufforerNavigation?.chaufforNamn?.toLowerCase().includes(searchFilter.toLowerCase()));
				this.count = items.length;
				this.items = items.slice(this.skip, this.skip + this.take);
				break;
			case 'Resurskategorier':
				const resurskategorier = this.input.dataSource as Resurskategorier[];
				items = resurskategorier.filter(resurskategori =>
					resurskategori.resurskategoriNamn.toLowerCase().includes(searchFilter.toLowerCase()) ||
					resurskategori.fkVerksamheterNavigation?.verksamhetNamn?.toLowerCase().includes(searchFilter.toLowerCase()));
				this.count = items.length;
				this.items = items.slice(this.skip, this.skip + this.take);
				break;
			default:
				throw new Error('No match');
		}

		this.addRows();
		this.isSearching = false;
	}

	private addRows() {
		if (this.items.length < this.take) {
			const rowsToAdd = this.take - this.items.length;
			this.items = this.items.concat(new Array(rowsToAdd));
		}
	}

	private handleViewportSizeChanged() {
		combineLatest([
			this.breakpointService.xsmall$,
			this.breakpointService.small$,
			this.breakpointService.medium$,
			this.breakpointService.large$,
			this.breakpointService.xlarge$,
		])
		.pipe(untilDestroyed(this))
		.subscribe(([xsmall]) => {
			const itemPickerDialog = this.elementRef.nativeElement as HTMLElement;
			const cdkOverlayPane = findFirstParentWithClass(itemPickerDialog, 'cdk-overlay-pane') as HTMLElement;
			const mdcDialogSurface = findFirstParentWithClass(itemPickerDialog, 'mdc-dialog__surface') as HTMLElement;
			if (xsmall) {
				cdkOverlayPane.style.width = '100%';
				cdkOverlayPane.style.height = '100%';
				cdkOverlayPane.style.maxWidth = '100vw';
				cdkOverlayPane.style.maxHeight = '100vh';
				mdcDialogSurface.style.borderRadius = '0px';
			} else {
				cdkOverlayPane.style.width = '1024px';
				cdkOverlayPane.style.height = '90vh';
				cdkOverlayPane.style.maxWidth = '90vw';
				cdkOverlayPane.style.maxHeight = '90vh';
				mdcDialogSurface.style.borderRadius = '4px';
			}
		});
	}

	private handleSearchFilterChanged() {
		this.searchFilterFormControl
			.valueChanges
			.pipe(untilDestroyed(this), debounceTime(250))
			.subscribe(() => {
				this.paginator?.firstPage();
				this.search();
			});
	}

	private handlePageChanged() {
		this.paginator.page
			.pipe(untilDestroyed(this))
			.subscribe(
				(pageEvent: PageEvent) => {
					this.skip = pageEvent.pageIndex * pageEvent.pageSize;
					this.search();
				}
			);
	}

	public remove(item: Pk) {
		this.selectedItems = [...this.selectedItems.filter(selectedItem => selectedItem.pk !== item.pk)];
	}

	public handleSelectionChanged(row: Pk | undefined) {
		if (row === undefined) return;

		const checked = this.selectedItems
			.map(selectedItem => selectedItem.pk)
			.includes(row.pk);

		checked ?
			this.selectedItems = [...this.selectedItems.filter(i => i.pk !== row.pk)] :
			this.selectedItems.push(row);
	}

	public isSelected(item: Pk) {
		return this.selectedItems.some(selectedItem => selectedItem.pk === item.pk);
	}

	public getColumnValue(column: string, item: Pk) {
		return column.split('.').reduce((prev, curr) => {
			if (prev === null) return null;

			if (typeof prev === 'object' && prev !== null && curr in prev) {
				return (prev as Record<string, unknown>)[curr];
			}

			return null;
		}, item as unknown);
	}

	public clearSelected() {
		this.selectedItems = [];
	}

	public ok() {
		this.dialogRef.close([...this.selectedItems]);
	}

	public cancel() {
		this.dialogRef.close([...this.input.dataSource.filter(item => this.input.initiallySelectedItemPks.includes(item.pk))]);
	}
}
