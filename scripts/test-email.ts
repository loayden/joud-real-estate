import { loadEnvConfig } from "@next/env";
import { Resend } from "resend";

loadEnvConfig(process.cwd());

function requireRealEnv(name: string) {
  const value = process.env[name];

  if (!value || value.includes("xxx") || value.includes("replace-with")) {
    throw new Error(`${name} is not configured with a real value.`);
  }

  return value;
}

async function main() {
  const apiKey = requireRealEnv("RESEND_API_KEY");
  const from = requireRealEnv("RESEND_FROM_EMAIL");
  const to = requireRealEnv("TEST_EMAIL_TO");
  const resend = new Resend(apiKey);

  const response = await resend.emails.send({
    from,
    to,
    subject: "Joud email verification test",
    html: "<p>Transactional email delivery is configured for Joud Real Estate.</p>",
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  console.log(`Email test accepted by Resend. id=${response.data?.id}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
