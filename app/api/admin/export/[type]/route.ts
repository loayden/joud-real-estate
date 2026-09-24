import { apiError, handleApiError } from "@/lib/api-response";
import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const exportTypes = ["properties", "users", "inquiries"] as const;

type ExportType = (typeof exportTypes)[number];
type CsvValue = string | number | boolean | Date | null | undefined;

function isExportType(value: string): value is ExportType {
  return exportTypes.includes(value as ExportType);
}

function normalizeCsvValue(value: CsvValue) {
  if (value instanceof Date) return value.toISOString();

  const normalized = String(value ?? "");
  const trimmed = normalized.trimStart();

  if (/^[=+\-@\t\r]/.test(trimmed)) {
    return `'${normalized}`;
  }

  return normalized;
}

function csvRow(values: CsvValue[]) {
  return `${values
    .map((value) => `"${normalizeCsvValue(value).replaceAll('"', '""')}"`)
    .join(",")}\n`;
}

async function writePropertiesExport(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
) {
  await writer.write(
    encoder.encode(
      csvRow([
        "id",
        "title_ar",
        "status",
        "listing_type",
        "price",
        "city",
        "region",
        "owner_email",
        "view_count",
        "inquiry_count",
        "created_at",
      ]),
    ),
  );

  let cursor: string | undefined;

  while (true) {
    const batch = await prisma.property.findMany({
      take: 100,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        titleAr: true,
        status: true,
        listingType: true,
        price: true,
        viewCount: true,
        inquiryCount: true,
        createdAt: true,
        city: { select: { nameAr: true } },
        region: { select: { nameAr: true } },
        user: { select: { email: true } },
      },
    });

    for (const property of batch) {
      await writer.write(
        encoder.encode(
          csvRow([
            property.id,
            property.titleAr,
            property.status,
            property.listingType,
            property.price.toString(),
            property.city.nameAr,
            property.region.nameAr,
            property.user.email,
            property.viewCount,
            property.inquiryCount,
            property.createdAt,
          ]),
        ),
      );
    }

    if (batch.length < 100) break;
    cursor = batch[batch.length - 1]?.id;
  }
}

async function writeUsersExport(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
) {
  await writer.write(
    encoder.encode(
      csvRow([
        "id",
        "email",
        "phone",
        "role",
        "status",
        "first_name",
        "last_name",
        "total_properties",
        "created_at",
      ]),
    ),
  );

  let cursor: string | undefined;

  while (true) {
    const batch = await prisma.user.findMany({
      take: 100,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            properties: true,
          },
        },
      },
    });

    for (const user of batch) {
      await writer.write(
        encoder.encode(
          csvRow([
            user.id,
            user.email,
            user.phone,
            user.role,
            user.status,
            user.profile?.firstName,
            user.profile?.lastName,
            user._count.properties,
            user.createdAt,
          ]),
        ),
      );
    }

    if (batch.length < 100) break;
    cursor = batch[batch.length - 1]?.id;
  }
}

async function writeInquiriesExport(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  encoder: TextEncoder,
) {
  await writer.write(
    encoder.encode(
      csvRow([
        "id",
        "property_title",
        "status",
        "sender_email",
        "guest_name",
        "guest_email",
        "guest_phone",
        "owner_email",
        "created_at",
        "message",
      ]),
    ),
  );

  let cursor: string | undefined;

  while (true) {
    const batch = await prisma.inquiry.findMany({
      take: 100,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        status: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        message: true,
        createdAt: true,
        sender: { select: { email: true } },
        property: {
          select: {
            titleAr: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    for (const inquiry of batch) {
      await writer.write(
        encoder.encode(
          csvRow([
            inquiry.id,
            inquiry.property.titleAr,
            inquiry.status,
            inquiry.sender?.email,
            inquiry.guestName,
            inquiry.guestEmail,
            inquiry.guestPhone,
            inquiry.property.user.email,
            inquiry.createdAt,
            inquiry.message,
          ]),
        ),
      );
    }

    if (batch.length < 100) break;
    cursor = batch[batch.length - 1]?.id;
  }
}

async function writeExport(
  type: ExportType,
  writer: WritableStreamDefaultWriter<Uint8Array>,
) {
  const encoder = new TextEncoder();

  await writer.write(encoder.encode("\uFEFF"));

  if (type === "properties") {
    await writePropertiesExport(writer, encoder);
  } else if (type === "users") {
    await writeUsersExport(writer, encoder);
  } else {
    await writeInquiriesExport(writer, encoder);
  }

  await writer.close();
}

export async function GET(
  _req: Request,
  { params }: { params: { type: string } },
) {
  try {
    await requireRole(["ADMIN", "SUPER_ADMIN"]);

    if (!isExportType(params.type)) {
      return apiError("Unsupported export type", 404, "EXPORT_NOT_FOUND");
    }

    const stream = new TransformStream<Uint8Array, Uint8Array>();
    const writer = stream.writable.getWriter();

    void writeExport(params.type, writer).catch(async (error) => {
      console.error(`CSV export failed for ${params.type}`, error);
      await writer.abort(error).catch(() => undefined);
    });

    return new Response(stream.readable, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${params.type}_export_${Date.now()}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
