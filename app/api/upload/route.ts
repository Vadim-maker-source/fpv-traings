import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomBytes } from "crypto";

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const ALLOWED_MIME = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const s3Client = new S3Client({
  endpoint: process.env.YANDEX_ENDPOINT?.trim() || "https://storage.yandexcloud.net",
  region: process.env.YANDEX_REGION || "ru-central1",
  credentials: {
    accessKeyId: process.env.YANDEX_ACCESS!,
    secretAccessKey: process.env.YANDEX_SECRET!,
  },
  forcePathStyle: true,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "uploads";

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
    }

    // Валидация
    if (file.size === 0) {
      return NextResponse.json({ error: "Пустой файл" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Файл больше ${MAX_FILE_SIZE / (1024 * 1024)} МБ` },
        { status: 400 }
      );
    }

    const mime = (file.type || "").toLowerCase();
    if (!ALLOWED_MIME.has(mime)) {
      return NextResponse.json(
        { error: `Тип файла не поддерживается: ${mime}` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileKey = `${folder}/${Date.now()}-${randomBytes(8).toString("hex")}-${fileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.YANDEX_BUCKET!,
        Key: fileKey,
        Body: buffer,
        ContentType: mime,
      })
    );

    const url = `https://${process.env.YANDEX_BUCKET}.storage.yandexcloud.net/${fileKey}`;

    return NextResponse.json({ url, fileName: file.name });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Ошибка загрузки файла" },
      { status: 500 }
    );
  }
}