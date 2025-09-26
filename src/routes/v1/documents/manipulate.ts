import crypto from 'node:crypto';
import { unlinkSync, writeFileSync } from "node:fs";
import { copyFile } from "node:fs/promises";
import path from "node:path";
import { Router } from "tezx";
import { useFormData } from 'tezx/helper';
import { tempDir } from "../../../config.js";
import { db, table_schema } from "../../../models/index.js";
import { ChildProcess, docs2tempPdf, imageExtractionFromPDFthumbnail, pdfParse, popplerPdfToText, runCommand } from "../../../utils/child_process.js";
import { slug } from "../../../utils/slug.js";
import { fileExists, safeUnlink } from '../../../utils/fileExists.js';
import openAiFileUPloadHandler from '../../../utils/ai/clients/openai/upload.js';
import { MCP, ModelName } from '../../../utils/ai/mcp.js';
import { Gemini } from '../../../utils/ai/clients/gemini.js';
import { OpenAiDocs } from '../../../utils/ai/clients/openAiDocs.js';
import { aiSuggestion } from '../../../utils/ai/clients/suggestion.js';

let manipulateDoc = new Router();

export interface UploadedDocument {
  url: string;
  status: "success" | "failed";
  thumbnail: string;
  file_size: number;
  title: string;
  license_id: string,
  hash_sha256: string;
  hash_md5: string;
  type: string; // e.g., "pdf", "docx"
  pages: string | number;
  can_download: boolean;
  visibility: "public" | "private";
  storage_path: string;
  can_comment: boolean;
  can_embed: boolean;
  original_name: string;
  vs_id: string,
  can_share: boolean;
  filename: string;
  content: string,
  category: string | number;
  tags: string[];
  summary: string;
}

manipulateDoc.post('/new', async (ctx) => {
  let user_id = ctx.auth?.user_info?.user_id || '';

  if (!user_id) {
    return ctx.status(401).json({ success: false, message: "Unauthorized" },);
  }

  const body = await ctx.req.json();
  const create: UploadedDocument[] = body?.create;

  if (!Array.isArray(create)) {
    return ctx.status(400).json({ success: false, message: "Invalid payload" },);
  }

  const insertedDocs = [];
  for (const doc of create) {
    try {

      let type = doc?.type?.toLowerCase()
      const documentType = type?.includes("pdf")
        ? "PDF"
        : type?.includes("doc")
          ? "DOCUMENT"
          : "PRESENTATION";
      let s = slug(doc?.title, Date.now());

      const missingFields: string[] = [];

      if (!doc?.title?.trim()) missingFields.push("Title is required");
      if (!doc?.summary?.trim()) missingFields.push("Summary is required");
      if (!Array.isArray(doc?.tags) || doc?.tags.length === 0) missingFields.push("At least one tag is required");

      if (missingFields.length) {
        insertedDocs.push({
          success: false,
          message: missingFields.join(", "),
          hash_sha256: doc?.hash_sha256,
        });
        break;
      }

      const { success: docSuccess, result: docResult, error } = await db.create(table_schema.documents,
        {
          cat_id: parseInt(String(doc.category)) || null,
          type: documentType,
          summary: doc.summary,
          title: doc.title,
          user_id: user_id,
          slug: s,
          can_download: doc.can_download,
          can_comment: doc.can_comment,

          can_embed: doc.can_embed,
          can_share: doc.can_share,
          // Optional: license_id, user_id, lang, score
          license_id: doc.license_id || null,
          // user_id: ctx.user?.id || null,
          // lang: doc.lang || null,
          // score: 0,
          tags: Array.isArray(doc.tags) ? JSON.stringify(doc.tags) : null,
        }).execute();

      if (!docSuccess) {
        insertedDocs.push({ success: false, message: "Failed to insert uploaded file info.", hash_sha256: doc?.hash_sha256 });
        break;
      }

      const doc_id = docResult.insertId;
      // delete original
      let targetDir = path.resolve('uploads/documents', doc?.type);
      try {
        // await fs.mkdir(targetDir, { recursive: true });

        const targetPath = path.join(targetDir, doc?.filename);
        let pdfPath = doc?.storage_path;
        let thumbnailFilename = `${path.parse(doc.filename).name}.webp`;
        let thumbnail = path.join(path.dirname(targetDir), 'thumbnails', type, thumbnailFilename);
        try {
          if (doc.thumbnail && await fileExists(doc.thumbnail)) {
            await copyFile(doc.thumbnail, thumbnail);
            await safeUnlink(doc.thumbnail);
          }
          else {
            const cmd = imageExtractionFromPDFthumbnail(pdfPath, thumbnail);
            await ChildProcess(cmd);
          }
        }
        catch {
        }
        thumbnail = `/documents/thumbnails/${doc?.type}/${thumbnailFilename}`

        try {
          if (type !== 'pdf') {
            const pdfFilename = `${path.parse(doc.filename).name}.pdf`;
            const pdfTemp = `${tempDir()}/${pdfFilename}`;
            const pdfDest = path.join(targetDir, 'converted', pdfFilename);
            pdfPath = pdfDest;
            // await mkdir(path.dirname(pdfDest), { recursive: true });
            copyFile(pdfTemp, pdfDest);
            if (await fileExists(pdfTemp)) {
              await safeUnlink(pdfTemp);         // delete original
            }
          }
        }
        catch {
        }

        // movedFiles.push(`/attachments/contact-requests/${filename}`);
        try {
          await copyFile(doc?.storage_path, targetPath);
          try {
            if (await fileExists(doc?.storage_path)) {
              safeUnlink(doc?.storage_path,);         // delete original
            }
          }
          catch {
          }
        }
        catch (err) {
          await db.delete(table_schema.documents, {
            where: db.condition({ doc_id, user_id }),
          }).execute();
          insertedDocs.push({
            success: false,
            message: "Failed to insert uploaded file. Please reload and again try upload.",
            hash_sha256: doc.hash_sha256
          });
          break;
        }

        const { success, result, error, errno } = await db.create(table_schema.doc_uploaded_files, {
          filename: doc.filename,
          doc_id: doc_id,
          original_name: doc.original_name,
          file_type: doc.type?.toLowerCase(),
          file_size: doc.file_size,
          pages: parseInt(String(doc.pages)) || null,
          // for open ai:
          vs_id: doc?.vs_id || null,
          content: doc?.content ?? null,
          storage_path: `/uploads/documents/${type}/${doc?.filename}`,
          hash_md5: doc.hash_md5,
          hash_sha256: doc.hash_sha256,
          thumbnail: thumbnail,
          visibility: doc.visibility?.toUpperCase() || 'PUBLIC',
        }).execute();

        if (!success) {
          if (errno === 1644) {
            insertedDocs.push({ success: false, message: error });
          } else {
            await db.delete(table_schema.documents, {
              where: db.condition({ doc_id, user_id }),
            }).execute();
            insertedDocs.push({ success: false, message: "Failed to insert uploaded file.", hash_sha256: doc.hash_sha256 });
          }
          break;
        }
        insertedDocs.push({
          success: true,
          slug: s,
          document_id: docResult.insertId,
          doc_id,
        });
      } catch (err) {
        throw Error("File moved not successfully")
      }
    } catch (err: any) {
      insertedDocs.push({ success: false, message: err?.message, hash_sha256: doc?.hash_sha256 });
    }
  }
  return ctx.status(400).json({ success: true, result: insertedDocs });
});

const mcp = new MCP();
mcp.registerModel('gemini', new Gemini());
mcp.registerModel('openai', new OpenAiDocs())

manipulateDoc.post('/upload', async (ctx) => {
  let user_id = ctx.auth?.user_info?.user_id || '';

  if (!user_id) {
    return ctx.status(401).json({ success: false, message: "Unauthorized" },);
  }
  try {

    let formData = await useFormData(ctx, {
      sanitized: true,
      allowedTypes: [
        // Documents
        "application/doc",
        "application/ms-doc",
        "application/msword",                      // .doc
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx

        "application/pdf",

        "application/mspowerpoint",
        "application/powerpoint",
        "application/x-mspowerpoint",
        "application/vnd.ms-powerpoint",           // .ppt
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" // .pptx,
      ]
    });

    const files = Array.isArray(formData.files) ? formData.files : [formData.files];
    const categories = JSON.parse(formData?.extraDataPost as any,);

    if (!files || files.length === 0) {
      return ctx.status(400).json({ error: 'No files uploaded' });
    }

    const processedFiles = [];
    for (const file of files) {
      let f = file as File;
      let processedFile: {
        filename?: string;
        thumbnail?: string;
        file_size?: number,
        title?: string,
        hash_sha256?: string,
        hash_md5?: string;
        pdf?: string;
        type?: string,
        storage_path?: string,
        vs_id?: string;
        pages?: number,
        success?: boolean,
        url?: string;
        visibility?: 'private',
        preview?: string,
        visibility_message?: string,
        summary?: string,
        category?: string | number;
        tags?: string[];
        content?: string;
      } = {
        success: false
        // success: true
      };
      const filename = (f as File).name;
      const tempFilePath = path.join(tempDir(), filename);
      // await mkdir(tempDir, { recursive: true });;
      const size = f.size;
      const mimeType = f.type;
      const buffer = Buffer.from(await f.arrayBuffer());
      const hash_md5 = crypto.createHash('md5').update(buffer).digest('hex');
      const hash_sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      const ext = path.extname(filename).toLowerCase().replace('.', '');
      let file_title = path.parse(filename).name
      processedFile.filename = filename;
      processedFile.file_size = size;
      processedFile.hash_sha256 = hash_sha256;
      processedFile.hash_md5 = hash_md5;
      processedFile.type = ext;

      let checking = (await db.findOne(table_schema.doc_uploaded_files, {
        where: db.condition({
          hash_sha256: hash_sha256
        })
      }).execute());
      const checkDoc = checking?.result?.[0];
      let alreadyAvailable = Array.isArray(checking?.result) && checking?.result.length > 0;
      if (alreadyAvailable) {
        processedFile.visibility = 'private';
        processedFile.vs_id = checkDoc?.vs_id;
        processedFile.content = checkDoc?.content;
        processedFile.visibility_message = "This file has already been shared publicly. If you still need it, upload privately.";
      }
      let pdf = tempFilePath;
      let thumbnail = path.join(tempDir(), `${file_title}.webp`);

      try {
        await writeFileSync(tempFilePath, buffer);
        if ('application/pdf' === mimeType) {
          await pdfParse(tempFilePath, processedFile)
        }
        else {
          let f = await ChildProcess(docs2tempPdf(tempFilePath, tempDir()));
          if (f?.success) {
            pdf = `${tempDir()}/${file_title}.pdf`;
            await pdfParse(pdf, processedFile);
          }
        }
        processedFile.pdf = pdf;
        // thumbnail = path.join(path.dirname(targetDir), 'thumbnails', type, thumbnailFilename);
        let cmd = imageExtractionFromPDFthumbnail(pdf, thumbnail);
        await ChildProcess(cmd);
        processedFile.thumbnail = thumbnail;
        // for open ai
        // let vs_id = (await openAiFileUPloadHandler(pdf, filename)).vs_id;
        // processedFile.vs_id = vs_id;

        if (!alreadyAvailable || !processedFile.content) {
          const result = await runCommand(popplerPdfToText(pdf, { layout: true, firstPage: 1, lastPage: 6 }));
          if (result.success && result.buffer) {
            const text = result.buffer.toString().trim();
            if (text.length > 0) {
              processedFile.content = text.slice(0, 5000);
            }
            else {
              console.log("⚠️ No text found. Try OCR with Tesseract.");
            }
          }
          else {
            // console.error("❌ Error:", result.message);
          }
        }

        let sessionId = `file://${pdf}`;
        let modelName: ModelName = 'openai';
        mcp.createSession(sessionId, [{ modelName: modelName }]);
        let model = mcp.useModel(sessionId, modelName);

        if (processedFile.content) {
          const prompt = aiSuggestion(categories, processedFile.content);
          let response = await model(prompt, { vs_id: undefined });
          // Extract first JSON object from response content using regex
          const jsonMatch = response?.[0]?.response?.content?.match(/{.*}/s);
          if (jsonMatch) {

            try {
              let json = JSON.parse(jsonMatch[0]) ?? {};
              processedFile.title = json?.title;
              processedFile.summary = json.summary;
              processedFile.tags = json.tags;
              processedFile.category = json?.category;
            }
            catch {

            }
            finally {
              mcp.deleteSession(sessionId)
            }
          }
        }
        processedFile.storage_path = tempFilePath;
        processedFile.url = tempFilePath;
        processedFiles.push(processedFile);
      }
      catch (err) {
        processedFiles.push({});
      }
    }
    return ctx.json({ files: processedFiles, success: true })
  }
  catch (err: any) {
    return ctx.status(400).json({ message: err?.message, success: false })
  }

});

manipulateDoc.delete('/:slug', async (ctx) => {
  const { slug } = ctx.req.params;
  const user_id = ctx.auth?.user_info?.user_id || '';

  if (!user_id) {
    return ctx.status(401).json({ success: false, message: "Unauthorized" },);
  }

  // 1. Find the document and verify ownership
  const docRes = await db.findOne(table_schema.documents, {
    joins: [
      {
        table: table_schema.doc_uploaded_files,
        type: "LEFT JOIN",
        on: 'documents.doc_id = doc_uploaded_files.doc_id'
      }
    ],
    columns: [
      'documents.user_id',
      'documents.view_count',
      'documents.reaction_count',
      'documents.doc_id',
      'doc_uploaded_files.storage_path',
      'doc_uploaded_files.filename',
      'doc_uploaded_files.file_type',
      'doc_uploaded_files.thumbnail',
    ],
    where: db.condition({ 'documents.doc_id': Number(slug) }),
  }).execute();

  if (!docRes?.result?.length) {
    return ctx.status(404).json({ success: false, message: "Document not found" },);
  }

  const doc = docRes.result[0];

  if (doc.user_id !== user_id) {
    return ctx.status(403).json({ success: false, message: "Forbidden" },);
  }

  // 2. Delete the document from the DB
  const { success } = await db.delete(table_schema.documents, {
    where: db.condition({ doc_id: Number(slug) }),
  }).update(table_schema.user_details, {
    where: db.condition({ user_id: user_id }),
    setCalculations: {
      reaction_count: `GREATEST(reaction_count - ${doc?.reaction_count}, 0)`,
      paper_views: `GREATEST(paper_views - ${doc?.view_count}, 0)`
    }
  }).executeMultiple();

  if (!success) {
    return ctx.status(500).json({ success: false, message: "Failed to delete document." },);
  }

  // 3. Attempt file cleanup
  const dir = path.resolve('uploads/documents', doc.file_type);
  const originalFile = path.join(dir, doc.filename);
  const convertedPdf = path.join(dir, 'converted', `${path.parse(doc.filename).name}.pdf`);

  try {
    if (await fileExists(originalFile)) await safeUnlink(originalFile);
    let thumbnail = path.join(process.cwd(), "uploads", doc.thumbnail);
    if (await fileExists(thumbnail)) await safeUnlink(thumbnail);
  } catch (err: any) {
    console.warn("Failed to delete original file:", err.message);
  }

  try {
    if (doc.file_type !== 'pdf' && await fileExists(convertedPdf)) {
      await safeUnlink(convertedPdf);
    }
  } catch (err: any) {
    console.warn("Failed to delete converted PDF:", err.message);
  }

  return ctx.status(400).json({ success: true, message: "Document deleted." });
});

manipulateDoc.put('/:slug/:file_id', async (ctx) => {
  const { slug, file_id } = ctx.req.params;
  const user_id = ctx.auth?.user_info?.user_id || '';

  if (!user_id) {
    return ctx.status(401).json({ success: false, message: "Unauthorized" },);
  }

  const body = await ctx.req.json();
  const {
    title,
    visibility,
    cat_id,
    summary,
    tags,
    license_id,
    can_comment,
    can_download,
    can_embed,
    can_share
  } = body;

  // Basic validation
  if (!title?.trim()) {
    return ctx.status(400).json({ success: false, message: "Title is required." },);
  }
  if (!summary?.trim()) {
    return ctx.status(400).json({ success: false, message: "Summary is required." },);
  }
  if (!Array.isArray(tags) || tags.length === 0) {
    return ctx.status(400).json({ success: false, message: "At least one tag is required." },);
  }
  // Perform multi-table update
  const { success, result, error, errno } = await db.update(table_schema.documents, {
    values: {
      title,
      cat_id,
      summary,
      tags: JSON.stringify(tags),
      license_id: license_id || null,
      can_comment: !!can_comment,
      can_download: !!can_download,
      can_embed: !!can_embed,
      can_share: !!can_share,
    } as any,
    where: db.condition({ slug, user_id }),
  })
    .update(table_schema.doc_uploaded_files, {
      values: { visibility: visibility?.toUpperCase() || "PUBLIC" },
      where: db.condition({ file_id }),
    })
    .executeMultiple();

  if (!success) {
    if (errno == 1644) {
      return ctx.status(500).json({ success: false, message: error, errno },);
    }
    return ctx.status(500).json({ success: false, message: error || "Update failed." },);
  }

  return ctx.status(400).json({ success: true, message: "Document updated successfully.", result });
});



export { manipulateDoc };
