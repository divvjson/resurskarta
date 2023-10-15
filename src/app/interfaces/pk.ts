import { Typed } from "./typed";

export interface Pk extends Typed {
	[key: string]: any;
	pk: number;
}