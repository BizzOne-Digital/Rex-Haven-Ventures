import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
//import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Mail, Phone } from "@/components/ui/Icons";
import { navItems, siteConfig, mailtoHref, telHref } from "@/lib/site";
import { services } from "@/lib/services";
import logo from "@/public/img/image.png"
const year = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-cream/70">
      {/* faint arch motif echo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-cream/5"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-10 h-56 w-56 rounded-full border border-cream/5"
      />

      <Container size="wide" className="relative">
        <div className="grid gap-14 py-16 md:py-20 lg:grid-cols-12 lg:gap-10">
          {/* Brand + CTA */}
          <div className="lg:col-span-5 lg:pr-10">
            {/* <Logo tone="light" /> */}
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center">
              <Image
                src={logo}
                alt={`${siteConfig.name} logo`}
                width={348}
                height={348}
                className="h-full w-full object-contain"
              />
            </div>
            <p className="mt-6 max-w-sm font-serif text-xl leading-snug text-cream/90">
              Investing in ideas. Building opportunities. Creating lasting value.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/55">
              {siteConfig.description}
            </p>
            <div className="mt-8">
              <Button href="/contact" variant="light" withArrow>
                Start a Conversation
              </Button>
            </div>
          </div>

          {/* Explore */}
          <nav aria-label="Footer" className="lg:col-span-2">
            <Eyebrow tone="light" withRule={false}>
              Explore
            </Eyebrow>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-cream/65 transition-colors hover:text-cream"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services */}
          <div className="lg:col-span-2">
            <Eyebrow tone="light" withRule={false}>
              What We Do
            </Eyebrow>
            <ul className="mt-5 flex flex-col gap-3 text-sm">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    href="/services"
                    className="text-cream/65 transition-colors hover:text-cream"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <Eyebrow tone="light" withRule={false}>
              Get in Touch
            </Eyebrow>
            <ul className="mt-5 flex flex-col gap-4 text-sm">
              <li>
                <a
                  href={mailtoHref}
                  className="group inline-flex items-start gap-3 text-cream/65 transition-colors hover:text-cream"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-burgundy-soft" />
                  <span className="break-all">{siteConfig.contact.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={telHref}
                  className="group inline-flex items-start gap-3 text-cream/65 transition-colors hover:text-cream"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-burgundy-soft" />
                  <span>{siteConfig.contact.phone}</span>
                </a>
              </li>
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-cream/40">
              We read every message personally and reply thoughtfully.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-cream/10 py-8 text-xs text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-cream/35">{siteConfig.tagline}</p>
        </div>
      </Container>
    </footer>
  );
}
