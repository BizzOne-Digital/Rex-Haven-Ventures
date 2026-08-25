import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/ui/PageHero";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { ContactForm } from "@/components/contact/ContactForm";
import { Mail, Phone } from "@/components/ui/Icons";
import { siteConfig, mailtoHref, telHref } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Start a conversation with Rex Haven Ventures. Whether you're an entrepreneur, an investor, or a potential partner, we'd like to hear from you.",
  alternates: { canonical: "/contact" },
};

const expectations = [
  {
    title: "A personal reply",
    body: "You'll hear back from a real person — never an autoresponder.",
  },
  {
    title: "Usually within two business days",
    body: "We read every message and take the time to respond thoughtfully.",
  },
  {
    title: "A genuine conversation",
    body: "No pressure and no hard sell — just an honest discussion about fit.",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let's start a conversation."
        description="Tell us what you're building or looking for. Every great venture begins with a first conversation — this could be yours."
      />

      <section className="bg-cream pb-24 md:pb-32">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Details */}
            <aside className="lg:col-span-5">
              <Reveal>
                <Eyebrow>Reach Us Directly</Eyebrow>
              </Reveal>
              <Reveal as="h2" delay={70} className="display-3 mt-5 text-ink">
                We&rsquo;re glad you&rsquo;re here.
              </Reveal>
              <Reveal as="p" delay={140} className="mt-5 max-w-md leading-relaxed text-muted">
                Prefer to reach out directly? Use the details below, or send us a note with the
                form and we&rsquo;ll take it from there.
              </Reveal>

              <Reveal delay={200} className="mt-9 flex flex-col gap-4">
                <a
                  href={mailtoHref}
                  className="group flex items-center gap-4 rounded-[6px] border border-line bg-beige-light/50 p-5 transition-colors hover:border-burgundy/30 hover:bg-beige-light"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[3px] bg-burgundy/8 text-burgundy transition-colors group-hover:bg-burgundy group-hover:text-cream">
                    <Mail className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Email
                    </span>
                    <span className="mt-0.5 block break-all font-medium text-ink group-hover:text-burgundy">
                      {siteConfig.contact.email}
                    </span>
                  </span>
                </a>

                <a
                  href={telHref}
                  className="group flex items-center gap-4 rounded-[6px] border border-line bg-beige-light/50 p-5 transition-colors hover:border-burgundy/30 hover:bg-beige-light"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[3px] bg-burgundy/8 text-burgundy transition-colors group-hover:bg-burgundy group-hover:text-cream">
                    <Phone className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      Phone
                    </span>
                    <span className="mt-0.5 block font-medium text-ink group-hover:text-burgundy">
                      {siteConfig.contact.phone}
                    </span>
                  </span>
                </a>
              </Reveal>

              <div className="hairline mt-10" />

              <Reveal delay={120}>
                <h3 className="eyebrow mt-10 text-muted">What to expect</h3>
                <ul className="mt-5 flex flex-col gap-5">
                  {expectations.map((item) => (
                    <li key={item.title} className="flex gap-4">
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-burgundy"
                      />
                      <div>
                        <p className="font-medium text-ink">{item.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </aside>

            {/* Form */}
            <div className="lg:col-span-7">
              <Reveal>
                <ContactForm />
              </Reveal>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
