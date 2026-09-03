import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * Global 404.
 *
 * Carries the site header and footer itself: this file sits above the `(site)`
 * route group, so it renders in the bare document shell and would otherwise
 * appear with no navigation at all.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <section className="flex min-h-[70vh] flex-1 items-center bg-cream pt-36 pb-24">
        <Container className="text-center">
          <div className="mx-auto flex max-w-xl flex-col items-center">
            <Eyebrow>404 &mdash; Page not found</Eyebrow>
            <h1 className="display-2 mt-6 text-ink">
              This page took a different path.
            </h1>
            <p className="lead mt-5">
              The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved. Let&rsquo;s
              get you back to something useful.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Button href="/" withArrow>
                Back to Home
              </Button>
              <Button href="/contact" variant="outline">
                Contact Us
              </Button>
            </div>
          </div>
        </Container>
      </section>
      <Footer />
    </div>
  );
}
