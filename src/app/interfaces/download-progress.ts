import { FileProgress } from "./file-progress";

export interface DownloadProgress {
	files: FileProgress[];
	status: null | 'downloading' | 'completed';
}
