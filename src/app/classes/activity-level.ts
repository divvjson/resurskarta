export class ActivityLevel {
	constructor(public threshold: number, public hexColor: string) { }
	static Level1 = new ActivityLevel(0 * 1000, '#E53935');
	static Level2 = new ActivityLevel(30 * 1000, '#F44336');
	static Level3 = new ActivityLevel(60 * 1000, '#EF5350');
	static Level4 = new ActivityLevel(90 * 1000, '#E57373');
	static Level5 = new ActivityLevel(120 * 1000, '#EF9A9A');
	static Level6 = new ActivityLevel(150 * 1000, '#FFCDD2');
	static Inactive = new ActivityLevel(180 * 1000, '#9E9E9E');
}
