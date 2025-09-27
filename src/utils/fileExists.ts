import { unlink } from "node:fs/promises";

export async function fileExists(path: string) {
    // case "node": {
    //     const { access } = await import("node:fs/promises");
    //     try {
    //         await access(path);
    //         return true;
    //     }
    //     catch {
    //         return false;
    //     }
    // }
    // case "bun":
    return Bun.file(path).exists();
    //     case "deno":
    //         try {
    //             await Deno.stat(path);
    //             return true;
    //         }
    //         catch {
    //             return false;
    //         }
    //     default:
    //         return false;
    // }
}

// utils/copyFile.ts
import { promises as fs } from "fs";
import { mkdir } from "fs/promises";
import { dirname } from "path";

/**
 * Copy a file from source to destination.
 *
 * - Creates parent directories if not exists
 * - Uses streaming under the hood (efficient for large files)
 *
 * @param src - Source file path
 * @param dest - Destination file path
 */
export async function copyFile(src: string, dest: string): Promise<void> {
    try {
        // Ensure parent directory exists
        await mkdir(dirname(dest), { recursive: true });
        // Copy the file
        await fs.copyFile(src, dest);
    }
    catch (err) {
        throw err;
    }
}



export async function safeUnlink(file: string) {
    try {
        await unlink(file);
    } catch { }
}