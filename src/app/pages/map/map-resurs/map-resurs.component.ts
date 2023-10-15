import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Resurser } from 'src/app/entities/Resurser';
import { SimulationService } from 'src/app/services/simulation.service';
import { BehaviorSubject, switchMap, tap, timer } from 'rxjs';
import { Matvarde } from 'src/app/entities/Matvarde';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { MapService } from '../map.service';
import { hasCommonElement } from 'src/app/functions/has-common-element.function';
import { ActivityLevel } from 'src/app/classes/activity-level';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@UntilDestroy()
@Component({
	selector: 'app-map-resurs',
	standalone: true,
	imports: [
		CommonModule,
		GoogleMapsModule,
		MatButtonModule,
		MatIconModule,
	],
	templateUrl: './map-resurs.component.html',
	styleUrls: ['./map-resurs.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapResursComponent implements OnInit {
	private simulationService = inject(SimulationService);
	private mapService = inject(MapService);
	@Input({ required: true }) public resurs!: Resurser;
	public latestMatvarde$ = new BehaviorSubject<Matvarde | null>(null);
	public latestPosition$ = new BehaviorSubject<google.maps.LatLngLiteral | null>(null);
	public markerOptions$ = new BehaviorSubject<google.maps.MarkerOptions>({
		icon: {
			path: google.maps.SymbolPath.CIRCLE,
			scale: 5,
			fillColor: 'white',
			fillOpacity: 1,
			strokeWeight: 1,
		},
		visible: false
	});
	private activityLevel$ = new BehaviorSubject<{ prev: ActivityLevel | null, current: ActivityLevel | null }>({
		prev: null,
		current: null,
	});
	@ViewChild(MapInfoWindow) public infoWindow!: MapInfoWindow;
	public isInfoWindowOpen = false;
	public geocodingAddress: string | null = null;

	constructor(
		private cdr: ChangeDetectorRef,
	) { }

	ngOnInit() {
		this.initMatvarde();
		this.handleIncomingMatvarde();
		this.handleMatvardeChanged();
		this.handleMapFilterChanged();
		this.handleActivityLevelChanged();
		this.handleFocusedResursChanged();
		this.handleHide();
	}

	private initMatvarde() {
		this.latestMatvarde$.next(this.mapService.getLatestMatvarde(this.resurs));
	}

	private handleIncomingMatvarde() {
		this.simulationService.currentMatvarde$
			.pipe(untilDestroyed(this))
			.subscribe(incomingMatvarde => {
				if (incomingMatvarde === null) return;
				if (incomingMatvarde.fkResurser !== this.resurs.pk) return;
				this.latestMatvarde$.next(incomingMatvarde as Matvarde);
			});
	}

	private handleMatvardeChanged() {
		this.latestMatvarde$
			.pipe(
				untilDestroyed(this),
				tap(() => {
					// Code that is executed only once when a new mätvärde is received
					this.setPosition();
				}),
				switchMap(() => {
					// Start a new timer each time a new value is entered
					return timer(0, 10000); // Starts immediately (0ms) and then runs every 10 seconds
				})
			).subscribe(() => {
				// Code to run every 10 seconds
				this.setVisibility();
				this.setColor();
			});
	}

	private handleMapFilterChanged() {
		this.mapService.mapFilter$
			.pipe(untilDestroyed(this))
			.subscribe(() => {
				this.setVisibility();
				this.setColor();
			});
	}

	private handleActivityLevelChanged() {
		this.activityLevel$
			.pipe(untilDestroyed(this))
			.subscribe(activityLevel => {
				if (activityLevel.current === null) return;
				this.setVisibility();
				this.setColor();
			});
	}

	private handleFocusedResursChanged() {
		this.mapService.focusedResurs$
			.pipe(untilDestroyed(this))
			.subscribe(focusedResurs => {
				const affected =
					focusedResurs.current?.pk === this.resurs.pk ||
					focusedResurs.prev?.pk === this.resurs.pk;

				if (affected) {
					this.setVisibility();
					this.setColor();
				}
			});
	}

	private handleHide() {
		this.mapService.hide$
			.pipe(untilDestroyed(this))
			.subscribe(duration => {
				// We do not hide the resurs we are currently animating to.
				if (this.mapService.getFocusedResurs().current?.pk === this.resurs.pk) return;
				const markerOptions = { ...this.markerOptions$.getValue() };
				markerOptions.visible = false;
				this.markerOptions$.next(markerOptions);
				setTimeout(() => {
					const markerOptions = { ...this.markerOptions$.getValue() };
					markerOptions.visible = this.getVisibility();
					this.markerOptions$.next(markerOptions);
				}, duration);
			});
	}

	private getVisibility() {
		const mapFilter = this.mapService.getMapFilter();

		// A focused resurs is always visible, regardless of any filter
		if (this.mapService.getFocusedResurs().current?.pk === this.resurs.pk) {
			return true;
		}

		if (mapFilter.resursPks.length > 0) {
			if (mapFilter.resursPks.includes(this.resurs.pk) === false) {
				return false;
			}
		}

		if (mapFilter.resurskategoriPks.length > 0) {
			const resurskategoriPks = this.resurs.resursResurskategorier.map(resursResurskategori => resursResurskategori.fkResurskategoriNavigation.pk);

			if (hasCommonElement(mapFilter.resurskategoriPks, resurskategoriPks) === false) {
				return false;
			}
		}

		if (mapFilter.fordonskategoriPks.length > 0) {
			const fordonskategoriPks = this.resurs.fkFordonNavigation?.fordonFordonskategorier.map(fordonFordonskategori => fordonFordonskategori.fkFordonskategorierNavigation.pk);

			if (fordonskategoriPks === undefined) {
				return false;
			}

			if (hasCommonElement(mapFilter.fordonskategoriPks, fordonskategoriPks) === false) {
				return false;
			}
		}

		if (mapFilter.showOnlyActive) {
			const matvarde = this.latestMatvarde$.getValue();

			if (matvarde === null) {
				return false;
			}

			const activityLevel = this.getActivityLevel(matvarde);

			if (activityLevel.threshold === ActivityLevel.Inactive.threshold) {
				return false;
			}
		}

		return true;
	}

	private getActivityLevel(matvarde: Matvarde) {
		const diff = this.simulationService.getCurrentDateTime().getTime() - new Date(matvarde.utc).getTime();

		if (diff >= ActivityLevel.Level1.threshold && diff < ActivityLevel.Level2.threshold) {
			return ActivityLevel.Level1;
		} else if (diff >= ActivityLevel.Level2.threshold && diff < ActivityLevel.Level3.threshold) {
			return ActivityLevel.Level2;
		} else if (diff >= ActivityLevel.Level3.threshold && diff < ActivityLevel.Level4.threshold) {
			return ActivityLevel.Level3;
		} else if (diff >= ActivityLevel.Level4.threshold && diff < ActivityLevel.Level5.threshold) {
			return ActivityLevel.Level4;
		} else if (diff >= ActivityLevel.Level5.threshold && diff < ActivityLevel.Level6.threshold) {
			return ActivityLevel.Level5;
		} else if (diff >= ActivityLevel.Level6.threshold && diff < ActivityLevel.Inactive.threshold) {
			return ActivityLevel.Level6;
		} else {
			return ActivityLevel.Inactive;
		}
	}

	private setPosition() {
		const latestMatvarde = this.latestMatvarde$.getValue();

		if (latestMatvarde === null) return;

		this.latestPosition$.next({ lat: latestMatvarde.latDd, lng: latestMatvarde.lonDd });
	}

	private setVisibility() {
		const markerOptions = { ...this.markerOptions$.getValue() };

		markerOptions.visible = this.getVisibility();

		if (markerOptions.visible === false && this.isInfoWindowOpen === true) {
			this.infoWindow.close();
			this.isInfoWindowOpen = false;
		}

		this.markerOptions$.next(markerOptions);
	}

	private setColor() {
		const latestMatvarde = this.latestMatvarde$.getValue();

		if (latestMatvarde === null) return;

		const markerOptions = { ...this.markerOptions$.getValue() };
		const isFocused = this.mapService.getFocusedResurs().current?.pk === this.resurs.pk;

		if (isFocused) {
			(markerOptions.icon as google.maps.Symbol).fillColor = '#673AB7';
		} else {
			const activityLevel = this.getActivityLevel(latestMatvarde);
			(markerOptions.icon as google.maps.Symbol).fillColor = activityLevel.hexColor;
		}

		this.markerOptions$.next(markerOptions);
	}

	public async openInfoWindow(marker: MapMarker) {
		this.infoWindow.open(marker);
		this.isInfoWindowOpen = true;

		const latestMatvarde = this.latestMatvarde$.getValue();

		if (latestMatvarde !== null) {
			this.geocodingAddress = await this.mapService.getAddress(latestMatvarde.latDd, latestMatvarde.lonDd);
			this.cdr.markForCheck();
		}
	}

	public handleInfoWindowClosed() {
		this.isInfoWindowOpen = false;
	}

	public log() {
		// console.log(this.resurs.fkFordonNavigation?.regnr);
		// const latestMatvarde = this.latestMatvarde$.getValue();
		// console.log(latestMatvarde);
	}

	public handleOrderClicked(event: Event) {
		event.preventDefault();
	}

	public getResurskategori() {
		return this.resurs.resursResurskategorier.at(0)?.fkResurskategoriNavigation.resurskategoriNamn;
	}

	public getFordonskategori() {
		return this.resurs.fkFordonNavigation?.fordonFordonskategorier.at(0)?.fkFordonskategorierNavigation.fordonskategoriNamn;
	}
}
