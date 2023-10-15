import { Pk } from "../interfaces/pk";

export interface Matvarde extends Pk {
	fkResurser: number;
	utc: string;
	latDd: number;
	lonDd: number;
	speedGpsKmH: number;
}
