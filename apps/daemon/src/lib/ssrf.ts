import { isLoopbackOrPrivateLanHost } from '../origin-validation.js';

// ponytail: block the SSRF-relevant cases (private/loopback/link-local targets,
// non-http schemes) and let public http(s) through. `allowLoopback` is the
// escape hatch for user-configured local services (Ollama, LM Studio, a local
// proxy) where hitting 127.0.0.1 is the whole point.

export interface OutboundUrlOptions {
  /** Permit loopback/private hosts — for user-configured local LLM/proxy endpoints. */
  allowLoopback?: boolean;
  /** Allowed protocols. Default http/https. */
  protocols?: string[];
}

const DEFAULT_PROTOCOLS = ['http:', 'https:'];

/**
 * Validate a URL before using it as an outbound fetch target. Rejects
 * non-http(s) schemes and, unless `allowLoopback`, any loopback/private/
 * link-local host. Returns the parsed URL so callers can fetch the normalized
 * value (breaking the raw-user-string taint).
 *
 * Throws on any violation — callers should treat that as a 400.
 */
export function assertOutboundUrlAllowed(raw: string | URL, options: OutboundUrlOptions = {}): URL {
  const protocols = options.protocols ?? DEFAULT_PROTOCOLS;
  let url: URL;
  try {
    url = raw instanceof URL ? raw : new URL(raw);
  } catch {
    throw new Error('invalid URL');
  }
  if (!protocols.includes(url.protocol)) {
    throw new Error(`disallowed URL protocol: ${url.protocol}`);
  }
  if (!options.allowLoopback && isLoopbackOrPrivateLanHost(url.hostname)) {
    throw new Error('URL host is not allowed');
  }
  return url;
}

/** Non-throwing variant: returns the URL or null. */
export function safeOutboundUrl(raw: string | URL, options: OutboundUrlOptions = {}): URL | null {
  try {
    return assertOutboundUrlAllowed(raw, options);
  } catch {
    return null;
  }
}
