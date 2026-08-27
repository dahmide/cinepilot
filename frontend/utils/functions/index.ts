export function replaceEmDashes(text: string): string {
    return text.replace(/\s*—\s*/g, ": ");
}
