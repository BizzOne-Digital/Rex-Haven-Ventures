import { Hero } from "@/components/home/Hero";
import { IntroSection } from "@/components/home/IntroSection";
import { ServicesPreview } from "@/components/home/ServicesPreview";
import { PhilosophySection } from "@/components/home/PhilosophySection";
import { AudienceSection } from "@/components/home/AudienceSection";
import { BlogPreview } from "@/components/home/BlogPreview";
import { CTASection } from "@/components/ui/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <IntroSection />
      <ServicesPreview />
      <PhilosophySection />
      <AudienceSection />

      {/* Lead-gen band */}
      <CTASection
        tone="cream"
        eyebrow="Let's Partner"
        title={
          <>
            Let&rsquo;s build{" "}
            <span className="accent-italic text-burgundy">what&rsquo;s next.</span>
          </>
        }
        description="Whether you're an entrepreneur with an idea or an investor seeking opportunity, the best next step is a conversation."
        primary={{ label: "Start a Conversation", href: "/contact" }}
        secondary={{ label: "View Our Services", href: "/services" }}
      />

      <BlogPreview />

      {/* Closing CTA */}
      <CTASection
        eyebrow="Get in Touch"
        title="Every great venture starts with a conversation."
        description="Tell us what you're building or looking for. We read every message personally and reply with genuine consideration."
        primary={{ label: "Start a Conversation", href: "/contact" }}
        secondary={{ label: "Explore Our Services", href: "/services" }}
      />
    </>
  );
}
