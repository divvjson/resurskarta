/**
 * Finds the closest parent (or ancestor) of the given element with the specified class name.
 *
 * @param {HTMLElement} element - The starting element.
 * @param {string} className - The class name to search for.
 * @returns {HTMLElement | null} - Returns the found parent/ancestor element or null if none found.
 */
export function findFirstParentWithClass(element: HTMLElement, className: string): HTMLElement | null {
	while (element && element !== document.body) {
		if (element.classList.contains(className)) {
			return element;
		}
		element = element.parentElement as HTMLElement; // Cast is necessary because parentElement can be null or HTMLElement.
	}
	return null;
}
