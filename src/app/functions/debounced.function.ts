import { Signal, effect, signal } from "@angular/core";

export function debounced<T>(input: Signal<T>, timeoutMs = 0): Signal<T> {
	const debounceSignal = signal(input());
	effect(() => {
		const value = input();
		const timeout = setTimeout(() => {
			debounceSignal.set(value);
		}, timeoutMs);
		return () => {
			clearTimeout(timeout);
		};
	});
	return debounceSignal;
}
