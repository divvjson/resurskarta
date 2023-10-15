/**
 * Returns a new array containing only the unique elements of the given array.
 *
 * @template T The type of the elements in the input array.
 * @param {Array<T>} array - The array to be filtered for unique elements.
 * @returns {Array<T>} A new array containing only the unique elements.
 * @example
 * const array = [1, 2, 2, 3, 4, 3, 5];
 * const uniqueArray = distinct(array);
 * console.log(uniqueArray);  // Output: [1, 2, 3, 4, 5]
 */
export function distinct<T>(array: Array<T>): Array<T> {
	return [...new Set<T>(array)];
}
