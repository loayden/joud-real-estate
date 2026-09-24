# Security Policy

## Supported Versions

Security fixes are applied to the active `main` branch and the latest deployed production release.

## Reporting a Vulnerability

Do not open public GitHub issues for suspected vulnerabilities. Send reports to the project owner with:

- A clear description of the issue.
- Affected route, component, API, or dependency.
- Reproduction steps.
- Impact assessment and any available proof of concept.

## Security Baseline

- Secrets must only live in environment variables and never in source control.
- Authentication, authorization, uploads, payments, and database changes require explicit review before production deployment.
- User-generated content must be validated server-side before persistence.
- File uploads must validate MIME type, size, and ownership server-side.
- Admin actions must be audited once the audit log is introduced.

## Local Development

Use `.env.example` as the reference template. Keep `.env`, `.env.local`, and all environment-specific files private.
