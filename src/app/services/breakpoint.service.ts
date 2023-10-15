import { Injectable, inject } from "@angular/core";
import { BreakpointObserver, Breakpoints, BreakpointState } from "@angular/cdk/layout";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class BreakpointService {
	private breakpointObserver = inject(BreakpointObserver);
	// 0-599
	public xsmall$ = new BehaviorSubject(false);
	// 600-959
	public small$ = new BehaviorSubject(false);
	// 960-1439
	public medium$ = new BehaviorSubject(false);
	// 1440-1919
	public large$ = new BehaviorSubject(false);
	// 1920-*
	public xlarge$ = new BehaviorSubject(false);

	constructor() {
		this.breakpointObserver
			.observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
			.subscribe(
				(breakpointState: BreakpointState) => {
					breakpointState.breakpoints[Breakpoints.XSmall] ? this.xsmall$.next(true) : this.xsmall$.next(false);
					breakpointState.breakpoints[Breakpoints.Small] ? this.small$.next(true) : this.small$.next(false);
					breakpointState.breakpoints[Breakpoints.Medium] ? this.medium$.next(true) : this.medium$.next(false);
					breakpointState.breakpoints[Breakpoints.Large] ? this.large$.next(true) : this.large$.next(false);
					breakpointState.breakpoints[Breakpoints.XLarge] ? this.xlarge$.next(true) : this.xlarge$.next(false);
				}
			);
	}
}
