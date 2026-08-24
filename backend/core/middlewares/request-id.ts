export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `req-${timestamp}-${randomPart}`;
}

export function extractRequestId(headerVal: string | null | undefined): string {
  if (headerVal && headerVal.trim().length > 0) {
    return headerVal.trim();
  }
  return generateRequestId();
}

export function extractCorrelationId(headerVal: string | null | undefined, fallbackRequestId: string): string {
  if (headerVal && headerVal.trim().length > 0) {
    return headerVal.trim();
  }
  return `corr-${fallbackRequestId}`;
}
