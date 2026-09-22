import type { Metadata } from 'next';
import Link from 'next/link';
import { SalunIcon } from '@/components/brand/SalunLogo';

export const metadata: Metadata = {
  title: 'Terms of Service — SalunBD',
  description: 'The terms that govern use of the SalunBD Customer and SalunBD Partner apps.',
};

// Public — deliberately outside AppShell, same as ../privacy-policy/page.tsx. Referenced from
// salon-customer-app's and salon-barber-app's login/signup screens (Terms of Service link), which
// previously just opened a bare `alert('Terms of Service')` with no actual document behind it.
const LAST_UPDATED = 'September 22, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-[19px] font-extrabold tracking-[-0.02em] text-[#1E293B]">{title}</h2>
      <div className="space-y-3 text-[14px] leading-relaxed text-[#475569]">{children}</div>
    </section>
  );
}

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="mt-2 text-[13px] text-[#64748B]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-9">
          <p className="text-[14px] leading-relaxed text-[#475569]">
            These terms govern use of the <strong>SalunBD Customer</strong> and <strong>SalunBD Partner</strong> mobile
            apps (together, &ldquo;SalunBD&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), a booking platform that connects
            customers with independent barbers and salon shops. By creating an account or using either app, you agree
            to these terms. See our <Link href="/privacy-policy" className="font-semibold text-[#635BFF] hover:underline">Privacy Policy</Link> for how we handle your data.
          </p>

          <Section title="Who can use SalunBD">
            <p>You must be at least 18 years old, or the age of legal majority where you live, to create an account. Barber and shop accounts represent that they are legally permitted to offer the services they list.</p>
          </Section>

          <Section title="What SalunBD is (and isn&rsquo;t)">
            <p>SalunBD is a booking marketplace. We connect customers with independent barbers and salon shops — we do not employ barbers, and shops are independently owned and operated. SalunBD is not a party to the service performed at the shop; the shop or barber is solely responsible for the quality, safety, and outcome of the services they provide.</p>
          </Section>

          <Section title="Bookings, cancellations, and no-shows">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Booking an appointment reserves a barber&rsquo;s time. Please cancel or reschedule as early as you can if your plans change.</li>
              <li>Each shop sets its own cancellation notice window and any associated policies; these are shown at booking time.</li>
              <li>Repeated no-shows or late cancellations may result in restrictions on future bookings.</li>
              <li>Barbers and shops are responsible for honoring confirmed bookings and communicating any changes to the customer promptly.</li>
            </ul>
          </Section>

          <Section title="Payments and wallet">
            <p>Cash, card, and mobile-payment methods are settled directly with the shop in person — SalunBD is not involved in that transaction. The in-app wallet (balance, top-ups, gift cards, loyalty points, referral rewards, and barber payout withdrawals) is operated by SalunBD and is subject to the balances and transaction history shown in the app. Wallet funds have no cash value outside the platform except through a withdrawal you request, which we process manually and may take time to complete.</p>
          </Section>

          <Section title="Reviews and conduct">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Reviews must reflect a genuine experience with the shop or barber being reviewed.</li>
              <li>You may not use SalunBD to harass, threaten, or defraud another user, post unlawful or infringing content, or attempt to circumvent the app&rsquo;s security or booking system.</li>
              <li>We may remove content or suspend accounts that violate these terms.</li>
            </ul>
          </Section>

          <Section title="Account suspension and termination">
            <p>You may stop using SalunBD, or request deletion of your account, at any time through the app&rsquo;s Security Settings. We may suspend or terminate an account that violates these terms, engages in fraud, or poses a risk to other users, shops, or the platform.</p>
          </Section>

          <Section title="Disclaimers and limitation of liability">
            <p>SalunBD is provided &ldquo;as is.&rdquo; We do our best to keep the app reliable and accurate, but we don&rsquo;t guarantee it will always be available, error-free, or uninterrupted. To the fullest extent permitted by law, SalunBD is not liable for the acts or omissions of independent shops or barbers, or for indirect, incidental, or consequential damages arising from your use of the app.</p>
          </Section>

          <Section title="Changes to these terms">
            <p>If we make material changes to these terms, we&rsquo;ll update the date above and, for significant changes, notify you in the app. Continuing to use SalunBD after a change takes effect means you accept the updated terms.</p>
          </Section>

          <Section title="Governing law">
            <p>These terms are governed by the laws of Bangladesh, without regard to conflict-of-law principles.</p>
          </Section>

          <Section title="Contact us">
            <p>
              Questions about these terms? Reach us at{' '}
              <a href="mailto:support@salunbd.com" className="font-semibold text-[#635BFF] hover:underline">
                support@salunbd.com
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
