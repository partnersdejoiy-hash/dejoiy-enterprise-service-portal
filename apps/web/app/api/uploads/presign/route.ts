import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth";
import { createAuditLog } from "@/lib/audit";
import { getUploadUrl } from "@/lib/s3";

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  module: z.enum([
    "tickets",
    "documents",
    "employment-verification",
    "background-verification",
    "learning",
    "avatars",
  ]),
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "video/mp4",
]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = presignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { fileName, contentType, module } = parsed.data;

    if (!allowedMimeTypes.has(contentType)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    const sanitizedFileName = sanitizeFileName(fileName);
    const finalFileName = `${module}/${session.id}/${Date.now()}-${sanitizedFileName}`;

    const upload = await getUploadUrl(finalFileName, contentType);

    await createAuditLog({
      userId: session.id,
      action: "FILE_UPLOAD_PRESIGNED",
      entityType: "Upload",
      entityId: null,
      metadata: {
        module,
        originalFileName: fileName,
        sanitizedFileName,
        finalFileName,
        contentType,
      },
      ipAddress: req.ip ?? "",
      userAgent: req.headers.get("user-agent") ?? "",
    });

    return NextResponse.json({
      uploadUrl: upload.uploadUrl,
      fileUrl: upload.fileUrl,
      key: upload.key,
      fileName: sanitizedFileName,
      contentType,
      module,
    });
  } catch (error) {
    console.error("Presign upload error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
