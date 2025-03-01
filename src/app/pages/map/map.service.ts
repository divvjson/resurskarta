import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { MatDrawer } from "@angular/material/sidenav";
import { BehaviorSubject, Observable, Subject, map } from "rxjs";
import { Matvarde } from "src/app/entities/Matvarde";
import { Resurser } from "src/app/entities/Resurser";
import { MapFilter } from "src/app/interfaces/map-filter";
import { SimulationService } from "src/app/services/simulation.service";

@Injectable({ providedIn: 'root' })
export class MapService {
	private simulationService = inject(SimulationService);
	private readonly mapFilterDefault: MapFilter = {
		resursPks: [],
		resurskategoriPks: [],
		fordonskategoriPks: [],
		showOnlyActive: true,
	};

	public googleMap: google.maps.Map | undefined;
	public googleGeocoder: google.maps.Geocoder | undefined;
	public drawer!: MatDrawer;
	public GEOCODING_API_KEY = 'AIzaSyAhV4_36GYtshMv3HKXKyLNju8gho1B2Ek' as const;
	// Cache object to store previous geocoding responses as strings
	private addressCache: { [key: string]: string } = {};

	private _mapFilter$ = new BehaviorSubject<MapFilter>({ ...this.mapFilterDefault });
	public get mapFilter$(): Observable<MapFilter> {
		return this._mapFilter$.asObservable().pipe(map(value => {
			return Object.assign(value);
		}));
	}
	public getMapFilter(): MapFilter {
		return Object.assign(this._mapFilter$.getValue());
	}
	public setMapFilter(value: MapFilter) {
		localStorage.removeItem('mapFilter');
		localStorage.setItem('mapFilter', JSON.stringify(value));
		this._mapFilter$.next(Object.assign(value));
	}

	private _focusedResurs$ = new BehaviorSubject<{ prev: Resurser | null, current: Resurser | null }>({
		prev: null,
		current: null,
	});
	public get focusedResurs$(): Observable<{ prev: Resurser | null, current: Resurser | null }> {
		return this._focusedResurs$.asObservable().pipe(map(value => {
			return Object.assign(value);
		}));
	}
	public getFocusedResurs(): { prev: Resurser | null, current: Resurser | null } {
		const value = this._focusedResurs$.getValue();
		return Object.assign(value);
	}
	public setFocusedResurs(value: { prev: Resurser | null, current: Resurser | null }) {
		this._focusedResurs$.next(value);
	}

	public hide$ = new Subject<number>();

	constructor(private http: HttpClient) {
		const mapFilterJson = localStorage.getItem('mapFilter');
		if (mapFilterJson === null) {
			localStorage.setItem('mapFilter', JSON.stringify({ ...this.mapFilterDefault }));
			this.setMapFilter({ ...this.mapFilterDefault });
		} else {
			const mapFilter = JSON.parse(mapFilterJson) as MapFilter;
			this.setMapFilter(mapFilter);
		}
	}

	public openDrawer() {
		this.drawer.open();
	}

	public closeDrawer() {
		this.drawer.close();
	}

	public importMapFilter(file: File) {
		const reader = new FileReader();

		reader.onload = (event: ProgressEvent<FileReader>) => {
			const fileReader = event.target as FileReader | null;
			const json = fileReader?.result;
			if (typeof (json) !== 'string') return;
			localStorage.removeItem('mapFilter');
			localStorage.setItem('mapFilter', json);
			const mapFilter = JSON.parse(json) as MapFilter;
			this.setMapFilter(mapFilter);
		};

		reader.readAsText(file);
	}

	public exportMapFilter() {
		const mapFilterJson = JSON.stringify(this._mapFilter$.getValue());
		const blob = new Blob([mapFilterJson], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		// Create an 'a' element and clicks on it to download the file
		const a = document.createElement('a');
		a.setAttribute('style', 'display:none;');
		a.href = url;
		a.download = 'mapFilter.json';
		document.body.appendChild(a);
		a.click();
		// Remove the 'a' element and the URL
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	public resetMapFilter() {
		this.setMapFilter({ ...this.mapFilterDefault });
	}

	public getLatestMatvarde(resurs: Resurser): Matvarde | null {
		// Sort the array based on timestamp, oldest first
		const sortedMatvarden = resurs.matvarden.sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime());
		// Find the metric that is closest to but not newer than current datetime
		const latestMatvarde = sortedMatvarden.reverse().find((data) => new Date(data.utc).getTime() <= this.simulationService.getCurrentDateTime().getTime());
		return latestMatvarde === undefined ? null : latestMatvarde as Matvarde;
	}

	public async getAddress(lat: number, lng: number) {
		// If the address exists in the cache, return it immediately.
		const cacheKey = `${lat},${lng}`;
		if (this.addressCache[cacheKey]) {
			return this.addressCache[cacheKey];
		}

		const latLng = { lat, lng };
		const geocoderResponse = await this.googleGeocoder?.geocode({ 'location': latLng });
		const address = geocoderResponse?.results?.at(0)?.formatted_address;

		if (typeof (address) !== 'string') throw new Error('Unable to parse out address string');
		
		this.addressCache[cacheKey] = address;

		return address;
	}

	public logGoogleMapValues() {
		if (!this.googleMap) return;
		const lat = this.googleMap.getCenter()?.lat();
		const lng = this.googleMap.getCenter()?.lng();
		console.log({
			zoom: this.googleMap.getZoom(),
			lat: lat,
			lng: lng,
		});
	}
}