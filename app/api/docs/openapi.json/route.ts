import type { OpenAPIV3 } from "openapi-types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const appUrl =
  (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim() ||
  "http://localhost:3000";

const spec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Joud Real Estate API",
    version: "1.0.0",
    description:
      "Versioned API surface for Joud Real Estate web and future mobile clients.",
  },
  servers: [
    {
      url: appUrl,
      description: "Configured application origin",
    },
  ],
  tags: [
    { name: "Properties" },
    { name: "Search" },
    { name: "Ratings" },
    { name: "Power Features" },
    { name: "Pexels" },
    { name: "Admin Intelligence" },
    { name: "Feature Flags" },
    { name: "Push" },
    { name: "System" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Auth.js JWT",
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name:
          process.env.NODE_ENV === "production"
            ? "__Secure-authjs.session-token"
            : "authjs.session-token",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
          code: { type: "string" },
        },
        required: ["success", "error"],
      },
      PropertyListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: { type: "object", additionalProperties: true },
              },
              total: { type: "integer" },
              page: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
      PushSubscriptionInput: {
        type: "object",
        required: ["endpoint", "keys"],
        properties: {
          endpoint: { type: "string", format: "uri" },
          keys: {
            type: "object",
            required: ["p256dh", "auth"],
            properties: {
              p256dh: { type: "string" },
              auth: { type: "string" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/v1/properties": {
      get: {
        tags: ["Properties"],
        summary:
          "List public approved properties or authenticated user listings",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }, {}],
        parameters: [
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20, maximum: 50 },
          },
          { name: "sort", in: "query", schema: { type: "string" } },
          {
            name: "listingType",
            in: "query",
            schema: { type: "string", enum: ["SALE", "RENT"] },
          },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" } },
          {
            name: "mine",
            in: "query",
            schema: { type: "boolean" },
            description:
              "When true, requires auth and returns caller listings.",
          },
        ],
        responses: {
          "200": {
            description: "Property list response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PropertyListResponse" },
              },
            },
          },
          "401": {
            description: "Authentication required for mine=true",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/api/v1/search": {
      get: {
        tags: ["Search"],
        summary: "Keyword property search with filters",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "regionId", in: "query", schema: { type: "string" } },
          { name: "cityId", in: "query", schema: { type: "string" } },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "minPrice", in: "query", schema: { type: "number" } },
          { name: "maxPrice", in: "query", schema: { type: "number" } },
        ],
        responses: {
          "200": { description: "Search results" },
          "429": { description: "Rate limited" },
        },
      },
    },
    "/api/v1/search/semantic": {
      post: {
        tags: ["Search"],
        summary: "Semantic AI search scaffold",
        responses: {
          "503": {
            description: "Semantic search is not enabled yet",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/api/v1/properties/recommendations/{id}": {
      get: {
        tags: ["Properties"],
        summary: "Return similar properties using category and city similarity",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Recommendations response" },
          "404": { description: "Property not found" },
        },
      },
    },
    "/api/ratings": {
      post: {
        tags: ["Ratings"],
        summary:
          "Submit a moderated property rating. Requires auth and a prior inquiry.",
        security: [{ cookieAuth: [] }],
        responses: {
          "201": { description: "Rating submitted for moderation" },
          "403": { description: "User is not eligible to rate this property" },
          "409": { description: "User already rated this property" },
        },
      },
    },
    "/api/ratings/property/{propertyId}": {
      get: {
        tags: ["Ratings"],
        summary: "List approved ratings and rating breakdown for a property",
        parameters: [
          {
            name: "propertyId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Approved property ratings" },
        },
      },
    },
    "/api/ratings/{id}/respond": {
      put: {
        tags: ["Ratings"],
        summary: "Owner response to an approved or pending review",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Owner response saved" },
          "403": { description: "Only the property owner may respond" },
        },
      },
    },
    "/api/properties/compare": {
      get: {
        tags: ["Power Features"],
        summary: "Return comparison details for up to four approved properties",
        parameters: [
          {
            name: "ids",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Comparison properties" },
        },
      },
    },
    "/api/price-alerts": {
      get: {
        tags: ["Power Features"],
        summary: "List authenticated user's active price alerts",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Active alerts" } },
      },
      post: {
        tags: ["Power Features"],
        summary: "Create or reactivate a property price-drop alert",
        security: [{ cookieAuth: [] }],
        responses: { "201": { description: "Alert saved" } },
      },
    },
    "/api/reports": {
      post: {
        tags: ["Power Features"],
        summary: "Report a suspicious or inaccurate property listing",
        security: [{ cookieAuth: [] }],
        responses: {
          "201": { description: "Report created" },
          "429": { description: "Report rate limit exceeded" },
        },
      },
    },
    "/api/properties/{id}/estimate": {
      get: {
        tags: ["Power Features"],
        summary:
          "Statistical market value estimate from similar approved listings",
        responses: { "200": { description: "Market estimate" } },
      },
    },
    "/api/properties/{id}/price-history": {
      get: {
        tags: ["Power Features"],
        summary: "Price change timeline for a property",
        responses: { "200": { description: "Price history" } },
      },
    },
    "/api/properties/{id}/neighbourhood-score": {
      get: {
        tags: ["Power Features"],
        summary: "Computed neighbourhood score and breakdown",
        responses: { "200": { description: "Neighbourhood score" } },
      },
    },
    "/api/pexels/hero": {
      get: {
        tags: ["Pexels"],
        summary: "Cached Pexels hero photography metadata",
        responses: { "200": { description: "Hero image list" } },
      },
    },
    "/api/pexels/category/{slug}": {
      get: {
        tags: ["Pexels"],
        summary: "Cached Pexels category photography metadata",
        responses: { "200": { description: "Category image list" } },
      },
    },
    "/api/pexels/placeholder": {
      get: {
        tags: ["Pexels"],
        summary:
          "Fallback property photography. Returns JSON with format=json or redirects to an image.",
        responses: { "200": { description: "Placeholder images" } },
      },
    },
    "/api/admin/competitive-score": {
      get: {
        tags: ["Admin Intelligence"],
        summary: "Platform health score and competitor matrix",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Competitive score" } },
      },
    },
    "/api/admin/market-insights": {
      get: {
        tags: ["Admin Intelligence"],
        summary: "Regional market aggregates and alert/report analytics",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Market insights" } },
      },
    },
    "/api/v1/push/subscribe": {
      post: {
        tags: ["Push"],
        summary: "Save a web push subscription for the authenticated user",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PushSubscriptionInput" },
            },
          },
        },
        responses: {
          "201": { description: "Subscription saved" },
          "401": { description: "Authentication required" },
        },
      },
    },
    "/api/feature-flags/{key}": {
      get: {
        tags: ["Feature Flags"],
        summary: "Read a public feature flag value",
        parameters: [
          {
            name: "key",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Feature flag value" },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Health check for uptime monitoring",
        responses: {
          "200": { description: "Healthy" },
          "503": { description: "Unhealthy dependency" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
