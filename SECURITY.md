# Security Documentation - AppForge

This document outlines the security measures implemented in the AppForge platform to ensure production readiness and data integrity.

## 1. Network Security & Performance

### Rate Limiting

- **Redis-backed Store**: Uses Redis to track request counts, ensuring persistence across server restarts.
- **Auth Routes**: Limited to 10 requests per 15 minutes per IP to mitigate brute-force attacks.
- **API Routes**: Limited to 100 requests per minute per user (or IP for guests).
- **Import Routes**: Limited to 5 imports per hour per user to prevent resource exhaustion.

### Security Headers

- **Helmet.js**: Implemented on the backend with a strict Content Security Policy (CSP).
- **HSTS**: Enabled for 1 year to enforce HTTPS.
- **HSTS Preload**: Included for browser-level enforcement.
- **Next.js Headers**: Custom headers for `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Permissions-Policy`.

### Compression

- **Gzip/Brotli**: Express compression middleware enabled with a 1kb threshold to reduce payload sizes and improve load times.

## 2. Data Integrity & Sanitization

### Input Sanitization

- **Backend**: Every string field in `app_data` is sanitized using `sanitize-html` before being stored in the database. All HTML tags and attributes are stripped by default for dynamic row data.
- **Frontend**: Untrusted strings from the JSON configuration (labels, titles) are sanitized using `DOMPurify` before rendering to prevent XSS via malicious configurations.

## 3. Infrastructure & Monitoring

### Environment Validation

- **Startup Checks**: All environment variables are validated against a Zod schema on process start. Missing or malformed required variables will cause the process to exit immediately with a clear error log.

### Error Tracking

- **Sentry Integration**: Integrated on the backend to capture 5xx errors.
- **Contextual Logging**: User ID and email are attached to Sentry events after successful authentication to aid in debugging user-specific issues.

## 4. Database Optimization

### Query Performance

- **Indexes**: Added composite indexes on `app_data` for `(appId, tableName)` and `(appId, tableName, createdBy)`.
- **Sorting**: Added a descending index on `createdAt` for performant listing of new records.
- **Auth**: Added index on `RefreshToken` for `(userId, isRevoked)` to speed up token validation.

## 5. Performance Verification

### Query Optimization

The `AppData` table uses composite indexes to optimize the most common access patterns:

- **Index `(appId, tableName)`**: Used by `listRecords` to quickly narrow down data for a specific table.
- **Index `(appId, tableName, createdBy)`**: Used when `userScoped` auth is enabled to filter data by the current user efficiently.
- **Index `createdAt DESC`**: Used for pagination and default sorting without requiring a full table scan for ordering.

### EXPLAIN ANALYZE Example

A typical query like `SELECT * FROM AppData WHERE appId = '...' AND tableName = '...' ORDER BY createdAt DESC LIMIT 20` will utilize the `AppData_appId_tableName_idx` for filtering and `AppData_createdAt_idx` for ordering, resulting in an index-only or index-supported scan instead of a sequential scan.
