export function slug(title: string, extra?: string | number): string {
    const base = title
        .toLowerCase()
        .trim()
        .replace(/[_\s]+/g, '-')               // Replace spaces/underscores with dash
        .replace(/[^a-z0-9-]+/g, '')           // Remove non-alphanumeric except dash
        .replace(/--+/g, '-')                  // Replace multiple dashes with one
        .replace(/^-+|-+$/g, '');              // Trim leading/trailing dashes
    if (extra !== undefined) {
        const extraPart = String(extra)
            .toLowerCase()
            .replace(/\s+/g, '-')              // Convert spaces to dashes in extra
            .replace(/[^a-z0-9-]/g, '');       // Clean up extra
        return `${base}-${extraPart}`;
    }
    return base;
}
