import { exec, spawn } from "node:child_process";
import { unlinkSync } from "node:fs";

export const ChildProcess = async (command: string, maxBuffer?: number): Promise<{ success: boolean, buffer?: Buffer, message?: string }> => {
    return new Promise((resolve) => {
        exec(command, {
            encoding: "buffer",
            maxBuffer: maxBuffer
            // maxBuffer: maxBuffer  1024 * 1024 * 10
        }, (error, stdout, stderr) => {
            if (error) {
                return resolve({ success: false, message: error.message });
            }

            // stderr is also a Buffer if encoding is buffer
            if (stderr && stderr.length > 0) {
                return resolve({ success: false, message: stderr.toString() });
            }

            resolve({ success: true, buffer: stdout });
        });
    });
};


/**
 * Bun.spawn wrapper similar to Node.js exec
 */
type ChildProcessResult = {
    success: boolean;
    buffer?: Buffer;
    message?: string;
};

export const runCommand = async (
    // cmd: string,
    args: string[] = [],
    maxBuffer = 1024 * 1024 * 50 // 50MB
): Promise<ChildProcessResult> => {
    try {
        const child = Bun.spawn({
            cmd: [...args],
            // cmd: [cmd, ...args],
            stdout: "pipe",
            stderr: "pipe",
            maxBuffer: maxBuffer,
        });

        const stdout = await new Response(child.stdout).arrayBuffer();
        const stderr = await new Response(child.stderr).text();

        const exitCode = await child.exited;

        if (exitCode === 0) {
            return {
                success: true,
                buffer: Buffer.from(stdout),
            };
        } else {
            return {
                success: false,
                message: stderr.trim() || `Command failed with code ${exitCode}`,
            };
        }
    } catch (err: any) {
        return {
            success: false,
            message: err.message || "Unknown error",
        };
    }
};


export const ChildProcessSpawn = async (
    command: string,
    shall: boolean = true,
    args: string[] = [],
    maxBuffer: number = 1024 * 1024 * 10 // default 10MB
): Promise<{ success: boolean; buffer?: Buffer; message?: string }> => {
    return new Promise((resolve) => {
        let resolved = false;

        const child = spawn(command, args, { shell: shall });

        const stdoutChunks: Buffer[] = [];
        const stderrChunks: Buffer[] = [];
        let stdoutLen = 0;

        const cleanupAndResolve = (result: { success: boolean; buffer?: Buffer; message?: string }) => {
            if (resolved) return;
            resolved = true;
            try {
                // best-effort kill the child if still running
                if (!child.killed) child.kill();
            } catch (e) {
                // ignore
            }
            resolve(result);
        };

        child.stdout?.on("data", (chunk: Buffer) => {
            const buf = Buffer.from(chunk);
            stdoutChunks.push(buf);
            stdoutLen += buf.length;

            if (maxBuffer > 0 && stdoutLen > maxBuffer) {
                cleanupAndResolve({
                    success: false,
                    message: `maxBuffer exceeded (${maxBuffer} bytes)`,
                });
            }
        });

        child.stderr?.on("data", (chunk: Buffer) => {
            stderrChunks.push(Buffer.from(chunk));
        });

        child.on("error", (err) => {
            cleanupAndResolve({ success: false, message: err.message });
        });

        child.on("close", (code, signal) => {
            if (resolved) return;

            const stderrBuf = stderrChunks.length ? Buffer.concat(stderrChunks) : Buffer.alloc(0);
            const stdoutBuf = stdoutChunks.length ? Buffer.concat(stdoutChunks) : Buffer.alloc(0);

            // If there was anything on stderr, treat as error (matches your original behavior)
            if (stderrBuf.length > 0) {
                return cleanupAndResolve({
                    success: false,
                    message: stderrBuf.toString("utf8"),
                });
            }

            // Non-zero exit code -> error
            if (code !== 0) {
                const msg = `Process exited with code ${code}` + (signal ? ` (signal: ${signal})` : "");
                return cleanupAndResolve({ success: false, message: msg });
            }

            // Success
            cleanupAndResolve({ success: true, buffer: stdoutBuf });
        });
    });
};


export const poppplerPdfInfo = (pdfPath: string, extract?: "Pages"): string => {
    const safePath = `"${pdfPath}"`; // quotes handle spaces
    if (extract) {
        return `pdfinfo ${safePath} | grep ${extract}`;
    }
    return `pdfinfo ${safePath}`;
};

export const getPdfInfoJSON = async (pdfPath: string): Promise<{ success: boolean, json: Record<string, any> }> => {
    const cmd = poppplerPdfInfo(pdfPath);
    let output: any = await ChildProcess(cmd);
    let buffer = output?.buffer;
    if (output?.success && Buffer.isBuffer(buffer)) {
        return {
            success: true,
            json: buffer.toString()?.split("\n")?.reduce((prev: Record<string, any>, current) => {
                let [title, value] = current?.split(":");
                let t = title?.trim();
                if (t) {
                    prev[t?.toLowerCase()] = value?.trim();
                    return prev
                }
                return prev;
            }, {})
        }
    }
    return { success: false, json: {} }
};

export function imageExtractionFromPDFthumbnail(pdfPath: string, outputImage: string, density: number = 300,): string {
    return `gm convert -density ${density} "${pdfPath}[0]" -resize 1300x720 -crop 650x360+0+0 webp:- >${outputImage}`;
}

export let multiplePageAppendShall = (pdfPath: string, page: number, imageFormat: string = "webp") => {
    // let image = [...Array(page).keys()]?.map(r => `${pdfPath}[${r}]`)?.join(" ");
    let image = `${pdfPath}[0-${page}]`;
    return `gm convert -density 300 ${image} -resize 520x -append ${imageFormat}:-`
    // return `gm convert -density 300 ${image} -resize 520x -append webp:- > xxxx.webp`
}

export const multiplePageAppend = (
    pdfPath: string,
    page: number,
    imageFormat: string = "webp"
): string[] => {
    return [
        "gm",
        "convert",
        "-density", "300",
        `${pdfPath}[0-${page}]`,
        "-resize", "520x",
        "-append",
        `${imageFormat}:-`
    ];
};

// pdftoppm -png -r 300 -f 1 -singlefile  -scale-to-x 1300 -scale-to-y 720 -x 0 -y 0 -W 650 -H 360 "task.pdf" "./"
// pdftoppm -png -f 1 -singlefile -r 300 -scale-to-x 1300 -scale-to-y 720 "task.pdf" "./"

export const popplerPdfToText = (
    pdfPath: string,
    options: {
        layout?: boolean;     // maintain physical layout, default true
        firstPage?: number;   // first page to convert
        lastPage?: number;    // last page to convert
        resolution?: number;  // DPI resolution, default 72/300
    } = {}
): string[] => {
    const {
        layout = true,
        firstPage,
        lastPage,
        resolution = 300,
    } = options;

    const args: string[] = [];

    if (layout) args.push("-layout");
    if (firstPage !== undefined) args.push("-f", String(firstPage));
    if (lastPage !== undefined) args.push("-l", String(lastPage));
    if (resolution !== undefined) args.push("-r", String(resolution));

    return [
        "pdftotext",
        ...args,
        "-enc", "UTF-8",
        pdfPath,
        "-" // stdout এ output
    ];
};



export let docs2tempPdf = (filePath: string, outdir: string) => {
    const command = `libreoffice --headless --convert-to pdf "${filePath}" --outdir "${outdir}"`;
    return command
}

export async function pdfParse(pdfPath: string, processedFile: any, unlink?: boolean) {
    let { json, success } = await getPdfInfoJSON(pdfPath);
    if (success) {
        const r: any = await ChildProcess(multiplePageAppendShall(pdfPath, 5));
        processedFile.pages = json?.pages
        processedFile.title = json?.title;
        // remove it now for super fast preview
        // processedFile.preview = `data:image/png;base64,${r?.buffer?.toString('base64')}`;
        if (unlink) {
            await unlinkSync(pdfPath);         // delete original
        }
    }
    else {
        throw Error("Pdf parse unsuccessful")
    }
}
