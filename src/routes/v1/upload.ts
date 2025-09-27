import { writeFile } from "fs/promises";
import path from "path";
import { Router } from "tezx";
import { useFormData } from "tezx/helper";
import { tempDir } from "../../config";

const tempUpload = new Router({
    basePath: '/temp/upload'
});

tempUpload.post("/", async (ctx) => {
    const formData = await useFormData(ctx, {
        maxSize: 100_000_000, // 100MB
    });

    const file = formData.file as File;
    if (!(file instanceof File)) {
        return ctx.status(400).json({ message: "Invalid file" });
    }

    try {
        // ✅ Step 1: get system temp dir

        // ✅ Step 2: unique filename inside temp dir
        const tempFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const tempPath = path.join(tempDir(), tempFileName);

        // ✅ Step 3: write file to temp dir
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(tempPath, buffer);

        // ✅ Step 4: return info (or process later with sharp)
        return ctx.json({
            success: true,
            url: tempPath, // full temp file path on system
            name: file.name,
            size: file.size,
            type: file.type,
        });
    } catch (error) {
        return ctx.status(500).json({ message: "Failed to save temp file" });
    }
});
export default tempUpload;