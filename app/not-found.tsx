import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="px-5 py-16 sm:px-8 lg:px-10">
      <p className="eyebrow">404</p>
      <h1 className="font-display mt-2 text-[28px] leading-none font-extrabold tracking-[-0.03em]">
        No screen at this address
      </h1>
      <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-ink-2">
        The link may be out of date, or the shop it pointed at may have been deleted.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-[3px] bg-ink px-3 py-2 text-[12px] font-medium text-white hover:bg-ink/85"
      >
        Go to the overview
      </Link>
    </div>
  );
}
