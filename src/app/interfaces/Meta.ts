import { FileInformation } from "./file-information";

export interface Meta {
	selectedDateTime: string;
	startDateTime: string;
	endDateTime: string;
	files: FileInformation[];
}