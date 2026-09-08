export function toErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    if (typeof error === "object" && error !== null && "message" in error) {
        return String((error as { message: unknown }).message);
    }

    return String(error);
}

export function replaceEmDashes(text: string): string {
    return text.replace(/\s*—\s*/g, ": ");
}

/**
 * Sorts an array of objects by a specific string key.
 * @param array - The array of objects to sort.
 * @param key - The property key to sort by (must resolve to a string value).
 * @param ascending - Sort direction (true for A-Z, false for Z-A).
 * @returns A new sorted array.
 */
export const sortByProperty = <T extends Record<string, any>>(
    array: T[],
    key: { [K in keyof T]: T[K] extends string ? K : never }[keyof T],
    ascending: boolean = true
): T[] => {
    return [...array].sort((a, b) => {
        // Explicitly cast to string since the type guard ensures it's a string property
        const valueA = (a[key] ?? "") as string;
        const valueB = (b[key] ?? "") as string;

        if (ascending) {
            return valueA.localeCompare(valueB);
        } else {
            return valueB.localeCompare(valueA);
        }
    });
};
