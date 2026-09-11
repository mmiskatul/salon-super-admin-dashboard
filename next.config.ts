import type { NextConfig } from "next";

/**
 * No `images.remotePatterns` on purpose: every remote image this console renders is a
 * tenant-supplied `logoUrl`/`coverImageUrl` pointing at a host we do not control and cannot
 * enumerate ahead of time. Those are rendered with a plain <img> (see components/ui/Mark.tsx)
 * rather than next/image, so there is no allowlist to keep in sync and no build-time failure
 * the first time an owner pastes a URL from a host nobody predicted.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
