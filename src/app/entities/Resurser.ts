import { Pk } from "../interfaces/pk";

export interface Resurser extends Pk {
	fkFordonNavigation: {
		regnr: string | null | undefined;
		fkKunderNavigation: {
			kundNamn: string;
		};
		fordonFordonskategorier: Array<{
			fkFordonskategorierNavigation: {
				pk: number;
				fordonskategoriNamn: string;
			};
		}>;
		fabrikat: string | null | undefined
		beteckning: string | null | undefined
		arsmodell: string | null | undefined;
	} | null | undefined;
	fkChaufforerNavigation: {
		chaufforNamn: string | null | undefined;
	} | null | undefined;
	matvarden: Array<{
		fkResurser: number;
		pk: number;
		utc: string;
		latDd: number;
		lonDd: number;
	}>;
	resursResurskategorier: Array<{
		fkResurskategoriNavigation: {
			pk: number;
			resurskategoriNamn: string;
		};
	}>;
}