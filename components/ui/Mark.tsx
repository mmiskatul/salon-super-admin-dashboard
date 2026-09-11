'use client';

import { useState } from 'react';
import { brandColor, initials } from '@/lib/format';

/**
 * A shop's identity square.
 *
 * Plain <img> rather than next/image on purpose: `logoUrl` is a free-text column an owner pastes
 * into, so the host is unknown at build time and cannot be added to an `images.remotePatterns`
 * allowlist. next/image would refuse to render the first logo from a host nobody predicted; this
 * degrades to the shop's initials on its own brand colour instead.
 */
export default function Mark({
  name,
  logoUrl,
  color,
  size = 28,
}: {
  name: string;
  logoUrl?: string | null;
  color?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const fill = brandColor(color);
  const showLogo = Boolean(logoUrl) && !broken;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[3px]"
      style={{ width: size, height: size, backgroundColor: showLogo ? '#fff' : fill }}
      aria-hidden
    >
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary tenant-supplied host; see above
        <img
          src={logoUrl as string}
          alt=""
          width={size}
          height={size}
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className="tabular font-semibold text-white"
          style={{ fontSize: Math.max(9, Math.round(size * 0.36)) }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
