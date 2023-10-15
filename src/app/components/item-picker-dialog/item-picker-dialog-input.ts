import { Pk } from "src/app/interfaces/pk";

export interface ItemPickerDialogInput {
	initiallySelectedItemPks: number[];
	identityColumn: string;
	columns: string[],
	headers: string[],
	title: string;
	dataSource: Pk[];
}