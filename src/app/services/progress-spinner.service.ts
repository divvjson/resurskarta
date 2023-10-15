import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: 'root' })
export class ProgressSpinnerService {
	public showProgressSpinner$ = new BehaviorSubject(false);
	public progressSpinnerValue$ = new BehaviorSubject(0);
}
