import { apiSuccess, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
  propertyListInclude,
  serializePropertyListItem,
} from "@/lib/property-listing";
import { getCached } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const properties = await getCached(
      "featured_properties",
      async () => {
        const records = await prisma.property.findMany({
          where: { status: "APPROVED", isFeatured: true },
          orderBy: [{ featuredUntil: "desc" }, { publishedAt: "desc" }],
          take: 6,
          include: propertyListInclude,
        });

        return records.map(serializePropertyListItem);
      },
      1800,
    );

    return apiSuccess(properties);
  } catch (error) {
    return handleApiError(error);
  }
}
