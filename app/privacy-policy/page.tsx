import type { Metadata } from 'next';
import Link from 'next/link';
import { SalunIcon } from '@/components/brand/SalunLogo';

export const metadata: Metadata = {
  title: 'Privacy Policy — SalunBD',
  description: 'How SalunBD collects, uses, and protects your information across the SalunBD Customer and SalunBD Partner apps.',
};

// Public — deliberately outside AppShell, so this is reachable with no session and no sidebar/nav
// chrome. This is the one page on this whole console meant for end users of the mobile apps, not
// platform operators. Referenced from: salon-customer-app's Settings screen and (auth) login/
// register screens, and salon-barber-app's own login/signup screens.
const LAST_UPDATED = 'September 18, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-[19px] font-extrabold tracking-[-0.02em] text-[#1E293B]">{title}</h2>
      <div className="space-y-3 text-[14px] leading-relaxed text-[#475569]">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F7]">
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-6 py-5">
          <SalunIcon size={26} />
          <p className="font-display text-[17px] leading-none font-extrabold tracking-[-0.02em] text-[#1E293B]">
            Salun<span className="text-[#635BFF]">BD</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-10">
          <p className="eyebrow text-[11px] font-bold tracking-[0.08em] text-[#635BFF] uppercase">Legal</p>
          <h1 className="font-display mt-1 text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] text-[#1E293B]">
            Privacy Policy
          </h1>
          <p className="mt-2 text-[13px] text-[#64748B]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-9">
          <p className="text-[14px] leading-relaxed text-[#475569]">
            This policy covers the <strong>SalunBD Customer</strong> and <strong>SalunBD Partner</strong> mobile
            apps (together, &ldquo;SalunBD&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), operated for
            multi-tenant salon and barbershop booking. It explains what information we collect, why, who we
            share it with, and the choices you have.
          </p>

          <Section title="Information we collect">
            <p><strong>Account information.</strong> Name, email address, phone number, and password (stored as a one-way hash — we never store or can retrieve your plaintext password) when you register. If you sign in as a shop owner, we also collect your business name.</p>
            <p><strong>Location.</strong> With your permission, your device&rsquo;s precise location, used to show you nearby shops and barbers and sort search results by distance. You can decline this at any time; the apps still work without it, just without distance-based sorting. We do not track your location in the background or when the app is closed.</p>
            <p><strong>Profile content.</strong> A profile photo and, for independent barbers, a cover photo, bio, and studio address/coordinates you choose to add.</p>
            <p><strong>Booking &amp; payment activity.</strong> Appointments you book, services selected, reviews and ratings you write, your loyalty points and membership status, and your in-app wallet balance and transaction history (top-ups, gift card redemptions, referral rewards, payments made from the wallet). We do not collect or store raw payment card numbers — cash, card, and mobile-payment methods are settled in person at the shop; only in-app wallet payments are processed by us.</p>
            <p><strong>Messages.</strong> Messages you exchange with a barber through the app&rsquo;s messaging feature (available once you&rsquo;ve completed a booking together), and messages you send to our support team.</p>
            <p><strong>Device &amp; usage information.</strong> Standard technical information any app server receives — IP address, general device/OS information, and app crash/error logs — used only to operate and secure the service, not for advertising.</p>
          </Section>

          <Section title="How we use your information">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>To create and secure your account, and verify your email address.</li>
              <li>To let you discover shops/barbers near you and complete bookings.</li>
              <li>To process in-app wallet payments, loyalty points, memberships, and referral rewards.</li>
              <li>To deliver booking confirmations, reminders, and other service notifications (you can control which categories you receive in the app&rsquo;s Notification Settings).</li>
              <li>To connect you with a barber you&rsquo;ve booked with, for direct messaging.</li>
              <li>To respond to support requests.</li>
              <li>To detect fraud, abuse, and keep the platform secure.</li>
            </ul>
          </Section>

          <Section title="Who we share information with">
            <p>We do not sell your personal information. We share it only with:</p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>The shop or barber you book with</strong> — your name, phone number, and booking details, so they can provide the service.</li>
              <li><strong>Service providers we use to run the app</strong>: Cloudinary (photo storage), Mapbox (maps), Resend (transactional email), and our cloud hosting and database providers. Each only receives what it needs to perform its function, and is not permitted to use your data for its own purposes.</li>
              <li><strong>Law enforcement or regulators</strong>, only if required by law.</li>
            </ul>
          </Section>

          <Section title="Your choices">
            <ul className="list-disc space-y-1.5 pl-5">
              <li><strong>Location permission</strong> can be granted or revoked at any time from your device&rsquo;s system settings.</li>
              <li><strong>Notification preferences</strong> can be changed per-category in the app.</li>
              <li><strong>Access and update</strong> your profile information directly in the app at any time.</li>
              <li><strong>Delete your account</strong> by requesting it through the app&rsquo;s Security Settings — this is reviewed and actioned by our support team; your booking history at shops you visited is retained by those shops for their own records, as is standard for any service you&rsquo;ve paid for, but your personal profile and login access are removed.</li>
            </ul>
          </Section>

          <Section title="Data retention">
            <p>We retain your account information for as long as your account is active. If you delete your account, your profile and login credentials are removed; appointment and payment records tied to a completed transaction may be retained by the relevant shop and in our financial records as required for accounting and legal purposes.</p>
          </Section>

          <Section title="Children&rsquo;s privacy">
            <p>SalunBD is not directed at children under 13, and we do not knowingly collect information from them.</p>
          </Section>

          <Section title="Changes to this policy">
            <p>If we make material changes to this policy, we&rsquo;ll update the date above and, for significant changes, notify you in the app.</p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about this policy or your data? Reach us at{' '}
              <a href="mailto:privacy@salunbd.com" className="font-semibold text-[#635BFF] hover:underline">
                privacy@salunbd.com
              </a>
              , or through the Support section in either app.
            </p>
          </Section>
        </div>

        <div className="mt-14 border-t border-[#E2E8F0] pt-6">
          <Link href="/" className="text-[13px] font-semibold text-[#635BFF] hover:underline">
            &larr; Back to SalunBD
          </Link>
        </div>
      </main>
    </div>
  );
}
