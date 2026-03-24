import fs from 'fs';

/**
 * Appends a single item to a JSON array file.
 * Creates the file with `[]` if it doesn't exist, then reads → parses → pushes → writes.
 */
export function appendToJsonFile<T>(filePath: string, item: T): void {
    let items: T[] = [];

    if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        items = JSON.parse(raw);
    }

    items.push(item);
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
}
