import { Environment, getSecurityProfile } from '../../config/environments';

export function getSecurityHeaders(customEnv?: Environment): Record<string, string> {
  const envKey = customEnv || (process.env.NODE_ENV as Environment) || 'development';
  const profile = getSecurityProfile(envKey);
  const isProduction = profile.isProduction;

  const headers: Record<string, string> = {
    // Prevent MIME-sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent Clickjacking (framing)
    'X-Frame-Options': 'DENY',

    // Cross-site scripting filter legacy fallback
    'X-XSS-Protection': '1; mode=block',

    // Referrer policy to avoid leakage
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy disabling unauthorized device access
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',

    // Cache control for API responses
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (isProduction || envKey === 'staging') {
    // Strict-Transport-Security for HTTPS environments (1 year)
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';

    // Content-Security-Policy
    headers['Content-Security-Policy'] = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // Next.js hydration
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https://picsum.photos",
      "font-src 'self' data:",
      "connect-src 'self' " + profile.cors.allowedOrigins.join(' '),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }

  return headers;
}

export function getCorsHeaders(
  requestOrigin: string | null,
  customEnv?: Environment
): Record<string, string> {
  const envKey = customEnv || (process.env.NODE_ENV as Environment) || 'development';
  const profile = getSecurityProfile(envKey);

  const allowedOrigins = profile.cors.allowedOrigins;
  const isAllowed =
    allowedOrigins.includes('*') ||
    (requestOrigin && allowedOrigins.includes(requestOrigin));

  const originHeader = isAllowed
    ? (requestOrigin || allowedOrigins[0] || '*')
    : allowedOrigins[0] || 'null';

  return {
    'Access-Control-Allow-Origin': originHeader,
    'Access-Control-Allow-Methods': profile.cors.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': profile.cors.allowedHeaders.join(', '),
    'Access-Control-Expose-Headers': profile.cors.exposedHeaders.join(', '),
    'Access-Control-Allow-Credentials': profile.cors.credentials ? 'true' : 'false',
    'Access-Control-Max-Age': profile.cors.maxAgeSeconds.toString(),
    Vary: 'Origin',
  };
}
