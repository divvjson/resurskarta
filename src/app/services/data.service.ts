import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpEventType } from "@angular/common/http";
import { BehaviorSubject, Observable, map } from 'rxjs';
import { DownloadProgress } from "../interfaces/download-progress";
import { FileProgress } from "../interfaces/file-progress";
import { Matvarde } from "../entities/Matvarde";
import { Meta } from "../interfaces/Meta";
import { Fordon } from "../entities/Fordon";
import { FordonFordonskategorier } from "../entities/FordonFordonskategorier";
import { Fordonskategorier } from "../entities/Fordonskategorier";
import { Resurser } from "../entities/Resurser";
import { Resurskategorier } from "../entities/Resurskategorier";
import { ResursResurskategorier } from "../entities/ResursResurskategorier";

@Injectable({ providedIn: 'root' })
export class DataService {
	private http = inject(HttpClient);
	public downloadProgress$ = new BehaviorSubject<DownloadProgress>({
		files: [],
		status: null,
	});
	public totalDownloaded$ = new BehaviorSubject<number>(0);
	public totalSize$ = new BehaviorSubject<number | null>(null);

	private _meta$ = new BehaviorSubject<Meta | null>(null);
	public get meta$(): Observable<Meta | null> {
		return this._meta$.asObservable().pipe(map(value => {
			return value === null ? null : Object.assign(value);
		}));
	}
	public getMeta() {
		const value = this._meta$.getValue();
		return value === null ? null : value;
	}

	private _fordon$ = new BehaviorSubject<Fordon[]>([]);
	public get fordon$() {
		return this._fordon$.asObservable().pipe(map(value => {
			return [...value];
		}));
	}
	public getFordon() {
		return [...this._fordon$.getValue()];
	}

	private _fordonFordonskategorier$ = new BehaviorSubject<FordonFordonskategorier[]>([]);
	public get fordonFordonskategorier$() {
		return this._fordonFordonskategorier$.asObservable().pipe(map(value => {
			return [...value];
		}));
	}
	public getFordonFordonskategorier() {
		return [...this._fordonFordonskategorier$.getValue()];
	}

	private _fordonskategorier$ = new BehaviorSubject<Fordonskategorier[]>([]);
	public get fordonskategorier$() {
		return this._fordonskategorier$.asObservable().pipe(map(value => {
			return [...value];
		}));
	}
	public getFordonskategorier() {
		return [...this._fordonskategorier$.getValue()];
	}

	private _matvarden$ = new BehaviorSubject<Matvarde[]>([]);
	public get matvarden$() {
		return this._matvarden$.asObservable().pipe(map(value => {
			return [...value];
		}));
	}
	public getMatvarden() {
		return [...this._matvarden$.getValue()];
	}

	private _resurser$ = new BehaviorSubject<Resurser[]>([]);
	public get resurser$() {
		return this._resurser$.asObservable().pipe(map(value => {
			return [...value];
		}));
	}
	public getResurser() {
		return [...this._resurser$.getValue()];
	}

	private _resurskategorier$ = new BehaviorSubject<Resurskategorier[]>([]);
	public get resurskategorier$() {
		return this._resurskategorier$.asObservable().pipe(map(value => {
			return [...value];
		}));
	}
	public getResurskategorier() {
		return [...this._resurskategorier$.getValue()];
	}

	private _resursResurskategorier$ = new BehaviorSubject<ResursResurskategorier[]>([]);
	public get resursResurskategorier$() {
		return this._resursResurskategorier$.asObservable().pipe(map(value => {
			return [...value];
		}));
	}
	public getResursResurskategorier() {
		return [...this._resursResurskategorier$.getValue()];
	}

	constructor() {
		this.downloadProgress$.subscribe(downloadProgress => {
			const totalDownloaded = downloadProgress.files.reduce((total, file) => total + file.downloaded, 0);
			this.totalDownloaded$.next(totalDownloaded);

			const totalSize = downloadProgress.files.reduce((total, file) => total + file.size, 0);
			this.totalSize$.next(totalSize);

			const completed =
				totalSize !== 0 &&
				totalDownloaded === totalSize &&
				downloadProgress.status === 'downloading';
			console.log(totalSize);
			console.log(totalDownloaded);
			console.log(downloadProgress);
			if (completed) {
				downloadProgress.status = 'completed';
				this.downloadProgress$.next({ ...downloadProgress });
			}
		});
	}

	public load() {
		const downloadProgress = this.downloadProgress$.getValue();
		if (downloadProgress.status === 'completed') return;
		downloadProgress.status = 'downloading';
		this.downloadProgress$.next(downloadProgress);
		const baseUrl = 'assets/data';

		this.http.get<Meta>(`${baseUrl}/$meta.json`)
			.subscribe((meta) => {
				this._meta$.next({ ...meta });

				for (const file of meta.files) {
					const fileProgress: FileProgress = {
						downloaded: 0,
						fileName: file.name,
						size: file.size,
					};

					const downloadProgress = this.downloadProgress$.getValue();
					downloadProgress.files.push(fileProgress);
					this.downloadProgress$.next(downloadProgress);

					const fileUrl = `${baseUrl}/${file.name}`;

					this.http
						.get(fileUrl, { reportProgress: true, observe: 'events', responseType: 'json' })
						.pipe(map((event) => {
							switch (event.type) {
								case HttpEventType.DownloadProgress:
									const currentDownloadProgress = this.downloadProgress$.getValue();
									const updatedFiles = currentDownloadProgress.files.map(fileProgress => {
										if (fileProgress.fileName === file.name) {
											return { ...fileProgress, downloaded: event.loaded };
										}
										return fileProgress;
									});

									this.downloadProgress$.next({
										...currentDownloadProgress,
										files: updatedFiles,
									});
									break;
								case HttpEventType.Response:
									switch (file.name) {
										case 'Fordon.json':
											this._fordon$.next(event.body as Fordon[]);
											break;
										case 'FordonFordonskategorier.json':
											this._fordonFordonskategorier$.next(event.body as FordonFordonskategorier[]);
											break;
										case 'Fordonskategorier.json':
											this._fordonskategorier$.next(event.body as Fordonskategorier[]);
											break;
										case 'Matvarde.json':
											this._matvarden$.next(event.body as Matvarde[]);
											break;
										case 'Resurser.json':
											this._resurser$.next(event.body as Resurser[]);
											break;
										case 'Resurskategorier.json':
											this._resurskategorier$.next(event.body as Resurskategorier[]);
											break;
										case 'ResursResurskategorier.json':
											this._resursResurskategorier$.next(event.body as ResursResurskategorier[]);
											break;
										default:
											throw new Error('No match');
									}
									break;
							}
						}))
						.subscribe();
				}
			});
	}
}
