import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { CTASection } from "@/components/ui/CTASection";
import { StatusPill } from "@/components/ui/StatusPill";
import { MySubmissions } from "@/components/account/MySubmissions";
import { getCurrentUser } from "@/lib/auth/session";
import { TextLink } from "@/components/ui/TextLink";

export const metadata: Metadata = {
  title: "My Account",
  description: "Your Rex Haven Ventures member account and contribution history.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Member account page.
 *
 * Guarded on the server: an unauthenticated visitor is redirected before any
 * markup is produced, so there is no flash of member content and no reliance on
 * client-side checks. `?next=` brings them back here after signing in.
 */
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  return (
    <>
      <PageHero
        eyebrow="Member Account"
        title={
          <>
            Hello, <span className="accent-italic">{user.name.split(" ")[0]}</span>.
          </>
        }
        description="Your account details and everything you have contributed to our published insights."
      />

      <section className="bg-cream pb-24 md:pb-32">
        <Container size="default">
          {/* Profile */}
          <Reveal>
            <div className="rounded-[6px] border border-line bg-beige-light/60 p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="font-serif text-2xl text-ink">Your details</h2>
                {user.role === "admin" && (
                  <StatusPill tone="brand">Administrator</StatusPill>
                )}
              </div>

              <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted">Name</dt>
                  <dd className="mt-1.5 text-[0.95rem] text-charcoal">{user.name}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted">Email</dt>
                  <dd className="mt-1.5 truncate text-[0.95rem] text-charcoal">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted">Member since</dt>
                  <dd className="mt-1.5 text-[0.95rem] text-charcoal">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-muted">Last sign-in</dt>
                  <dd className="mt-1.5 text-[0.95rem] text-charcoal">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "This is your first visit"}
                  </dd>
                </div>
              </dl>

              <p className="mt-7 text-sm leading-relaxed text-muted">
                Need to change your name or email, or close your account?{" "}
                <TextLink href="/contact" icon="none">
                  Get in touch
                </TextLink>{" "}
                and we&rsquo;ll take care of it.
              </p>

              {user.role === "admin" && (
                <p className="mt-4 text-sm text-muted">
                  <TextLink href="/admin">Open the admin dashboard</TextLink>
                </p>
              )}
            </div>
          </Reveal>

          {/* Contributions */}
          <div className="mt-14">
            <Reveal>
              <h2 className="font-serif text-2xl text-ink">Your contributions</h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                Feedback and insights you have shared on our articles. Everything is reviewed
                by our team before it appears publicly — you can track the status of each one
                here.
              </p>
            </Reveal>

            <div className="mt-8">
              <MySubmissions />
            </div>
          </div>
        </Container>
      </section>

      <CTASection
        eyebrow="Keep Reading"
        title="More perspectives worth your time."
        description="Browse our latest thinking on investing, building, and partnership — and add your own view."
        primary={{ label: "Read our insights", href: "/blog" }}
        secondary={{ label: "Start a Conversation", href: "/contact" }}
      />
    </>
  );
}
