import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationService } from 'src/app/services/simulation.service';
import { DataService } from 'src/app/services/data.service';
import { GoogleMapsModule } from '@angular/google-maps';
import { HttpClient } from '@angular/common/http';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointService } from 'src/app/services/breakpoint.service';
import { MatIconModule } from '@angular/material/icon';
import { MapMenuComponent } from 'src/app/pages/map/map-menu/map-menu.component';
import { MapService } from './map.service';
import { SpinnerService } from 'src/app/services/spinner.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Resurser } from 'src/app/entities/Resurser';
import { MapResursComponent } from './map-resurs/map-resurs.component';
import { Easing, Tween, update } from "@tweenjs/tween.js";
import { ClockComponent } from 'src/app/components/clock/clock.component';

@UntilDestroy()
@Component({
	selector: 'app-map',
	standalone: true,
	imports: [
		ClockComponent,
		CommonModule,
		GoogleMapsModule,
		MapMenuComponent,
		MapResursComponent,
		MatButtonModule,
		MatIconModule,
		MatSidenavModule,
	],
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements OnInit, AfterViewInit {
	private spinnerService = inject(SpinnerService);
	private dataService = inject(DataService);
	private simulationService = inject(SimulationService);
	private http = inject(HttpClient);
	private cdr = inject(ChangeDetectorRef);
	public mapService = inject(MapService);
	public breakpointService = inject(BreakpointService);
	private readonly INITIAL_MAP_POSITION = this.getInitialMapPosition();
	private readonly MAP_OPTIONS: google.maps.MapOptions = {
		disableDoubleClickZoom: true,
		fullscreenControl: false,
		mapTypeControl: false,
		streetViewControl: false,
		zoomControl: false,
		zoom: this.INITIAL_MAP_POSITION.zoom,
	};
	private readonly MAP_CAMERA_OPTIONS: google.maps.CameraOptions = {
		zoom: this.INITIAL_MAP_POSITION.zoom,
		center: this.INITIAL_MAP_POSITION.center,
	};
	private readonly ANIMATION_DURATION = 1000;


	public mapApiLoaded$ = new BehaviorSubject(false);
	public mapCenter = { ...this.INITIAL_MAP_POSITION.center };
	public mapOptions = { ...this.MAP_OPTIONS };
	private tilesLoaded$ = new BehaviorSubject(false);
	public resurser: Resurser[] = [];
	private allLoaded = false;
	@ViewChild(MatDrawer)
	public drawer!: MatDrawer;

	ngOnInit() {
		this.spinnerService.showSpinner$.next(true);
		this.handleAllLoaded();
		this.handleFocusedResursChanged();
		this.initMapApi();
		this.dataService.load();
		this.simulationService.start();
	}

	ngAfterViewInit() {
		this.mapService.drawer = this.drawer;
	}

	private handleAllLoaded() {
		combineLatest([
			this.mapApiLoaded$,
			this.tilesLoaded$,
			this.dataService.downloadProgress$,
			this.dataService.resurser$,
		])
			.pipe(untilDestroyed(this))
			.subscribe(([mapApiLoaded, tilesLoaded, downloadProgress, resurser]) => {
				this.allLoaded = mapApiLoaded && tilesLoaded && downloadProgress.status === 'completed' && resurser.length > 0;
				if (this.allLoaded) {
					this.resurser = resurser;
					this.spinnerService.showSpinner$.next(false);
					this.cdr.markForCheck();
				}
			});
	}

	private initMapApi() {
		if (window.google) {
			this.mapApiLoaded$.next(true);
			return; // Already loaded
		}

		this.http
			.jsonp(`https://maps.googleapis.com/maps/api/js?key=${this.mapService.MAPS_API_KEY}`, 'callback')
			.subscribe(() => this.mapApiLoaded$.next(true));
	}

	public handleMapInitialized(googleMap: google.maps.Map) {
		this.mapService.googleMap = googleMap;
		this.mapService.googleGeocoder = new google.maps.Geocoder();
	}

	public handleTilesLoaded() {
		// We are only interested in knowing whether the tiles have been
		// loaded when the map is loaded initially, i.e. the first time.
		// If everything has already loaded, we simply return here.
		if (this.allLoaded) return;
		this.tilesLoaded$.next(true);
	}

	private handleFocusedResursChanged() {
		this.mapService.focusedResurs$
			.pipe(untilDestroyed(this))
			.subscribe(focusedResurs => {
				if (focusedResurs.current === null) {
					this.animate(this.MAP_CAMERA_OPTIONS);
					return;
				}

				const target = this.mapService.getLatestMatvarde(focusedResurs.current);

				if (target === null) {
					this.animate(this.MAP_CAMERA_OPTIONS);
					return;
				}

				const currentZoom = this.mapService.googleMap?.getZoom();

				if (currentZoom === undefined) {
					throw new Error('A map animation was initiated while the map was not yet initialized.');
				}

				this.animate({
					zoom: currentZoom + 1,
					center: { lat: target.latDd, lng: target.lonDd },
				});
			});
	}

	private animate(to: google.maps.CameraOptions) {
		if (this.mapService.googleMap === undefined) return;

		const currentZoom = this.mapService.googleMap.getZoom();
		const currentCenter = this.mapService.googleMap.getCenter();

		if (currentZoom === undefined || currentCenter === undefined) {
			throw new Error('A map animation was initiated while the map was not yet initialized.');
		}

		const from: google.maps.CameraOptions = {
			zoom: currentZoom,
			center: {
				lat: currentCenter.lat(),
				lng: currentCenter.lng(),
			},
		};

		this.mapService.hide$.next(this.ANIMATION_DURATION);

		new Tween(from)
			.to(to, this.ANIMATION_DURATION)
			.easing(Easing.Quadratic.In)
			.onUpdate(() => {
				this.mapService.googleMap?.moveCamera(from);
			})
			.start();

		function animate(time: number) {
			requestAnimationFrame(animate);
			update(time);
		}

		requestAnimationFrame(animate);
	}

	private getInitialMapPosition(): { zoom: number, center: google.maps.LatLngLiteral } {
		if (this.breakpointService.xsmall$.getValue()) {
			return {
				zoom: 7,
				center: {
					lat: 55.816672317169626,
					lng: 13.537601532421867,
				}
			};
		}

		if (this.breakpointService.small$.getValue()) {
			return {
				zoom: 8,
				center: {
					lat: 56.05205834610317,
					lng: 13.798526825390617,
				}
			};
		}

		if (this.breakpointService.medium$.getValue()) {
			return {
				zoom: 8,
				center: {
					lat: 56.08272214272324,
					lng: 14.468692841015617,
				}
			};
		}

		if (this.breakpointService.large$.getValue()) {
			return {
				zoom: 9,
				center: {
					lat: 55.94348425875954,
					lng: 13.970527371327242,
				}
			};
		}

		if (this.breakpointService.xlarge$.getValue()) {
			return {
				zoom: 9,
				center: {
					lat: 55.94809832723614,
					lng: 14.047431668202242,
				}
			};
		}

		throw new Error('No match');
	}
}
