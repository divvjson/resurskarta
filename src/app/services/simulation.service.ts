import { Injectable, inject } from "@angular/core";
import { DataService } from "./data.service";
import { BehaviorSubject, Observable, combineLatest, interval, map, take, timer } from "rxjs";
import { Matvarde } from "../entities/Matvarde";

@Injectable({ providedIn: 'root' })
export class SimulationService {
	private _currentDateTime$ = new BehaviorSubject<Date>(new Date());
	public get currentDateTime$() {
		return this._currentDateTime$.asObservable().pipe(map(value => {
			return Object.assign(value);
		}));
	}
	public getCurrentDateTime(): Date {
		return Object.assign(this._currentDateTime$.getValue());
	}

	private matvardeToBeSimulated: Matvarde[] = [];
	private dataService = inject(DataService);

	private _currentMatvarde$ = new BehaviorSubject<Matvarde | null>(null);
	public get currentMatvarde$(): Observable<Matvarde | null> {
		return this._currentMatvarde$.asObservable().pipe(map(value => {
			return value === null ? null : Object.assign(value);
		}));
	}

	public start() {
		combineLatest([this.dataService.meta$, this.dataService.matvarden$]).subscribe(([meta, matvarden]) => {
			if (meta !== null && matvarden.length > 0) {
				this._currentDateTime$.next(new Date(meta.selectedDateTime));
				this.matvardeToBeSimulated = matvarden
					.filter(matvarde => new Date(matvarde.utc) > this.getCurrentDateTime())
					.sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime());

				// Tick tock (move time forward)
				interval(1000).subscribe(() => {
					const newCurrentDateTime = new Date(this._currentDateTime$.getValue().getTime() + 1000); // Increment by 1 second
					this._currentDateTime$.next(newCurrentDateTime);
				});

				this.scheduleNext();
			}
		});
	}

	private scheduleNext() {
		if (this.matvardeToBeSimulated.length > 0) {
			const nextTime = new Date(this.matvardeToBeSimulated[0].utc).getTime() - this._currentDateTime$.getValue().getTime();
			if (nextTime <= 0) {
				this.processMatvarde();
			} else {
				timer(nextTime)
					.pipe(take(1))
					.subscribe(() => this.processMatvarde());
			}
		}
	}

	private processMatvarde() {
		if (this.matvardeToBeSimulated.length > 0) {
			const currentMatvarde = this.matvardeToBeSimulated.shift();

			if (currentMatvarde) {
				this._currentMatvarde$.next(currentMatvarde);

				this.scheduleNext();
			}
		}
	}
}