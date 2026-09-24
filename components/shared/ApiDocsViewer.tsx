"use client";

import "swagger-ui-react/swagger-ui.css";
import SwaggerUI from "swagger-ui-react";

export function ApiDocsViewer() {
  return <SwaggerUI docExpansion="list" url="/api/docs/openapi.json" />;
}
