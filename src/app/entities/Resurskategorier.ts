import { Pk } from "../interfaces/pk";

export interface Resurskategorier extends Pk {
	resurskategoriNamn: string;
	fkVerksamheterNavigation: {
		verksamhetNamn: string;
	};
}