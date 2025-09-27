import { createWorker } from "tesseract.js";
import { ChildProcess, multiplePageAppendShall } from "./child_process";

export const ocrPdf = async (
    pdfPath: string,
    pages: number = 0,
    langs: string = "eng+ben+hin+tam+kan+mal+ara+fra+deu+spa+ita+por+rus+chi_sim+chi_tra+jpn+kor"
): Promise<string> => {
    // convert PDF → image buffer
    const { success, buffer, message } = await ChildProcess(
        multiplePageAppendShall(pdfPath, pages, "png")
    );

    if (!success || !buffer) {
        throw new Error("PDF → Image conversion failed: " + message);
    }

    // create OCR worker with multi-language support
    const worker = await createWorker();

    try {
        const { data } = await worker.recognize(buffer);
        return data.text.trim();
    } finally {
        await worker.terminate();
    }
};