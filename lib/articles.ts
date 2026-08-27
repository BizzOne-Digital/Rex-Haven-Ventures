/**
 * Blog / News content.
 *
 * NOTE: These are clearly-labelled placeholder ("demo") perspective pieces so the
 * blog is fully functional and populated. They make no factual claims about
 * Rex Haven Ventures' track record. Replace `articles` with real content — or wire
 * this module to a CMS/MDX source — when the client supplies it. The data shape is
 * intentionally simple and self-contained.
 */

export type ArticleCategory =
  | "Investing"
  | "Entrepreneurship"
  | "Business Strategy"
  | "Venture Building";

export type ArticleCover = "arch" | "grid" | "ridge" | "orbit" | "column" | "wave" | "spark";

export type ContentBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: ArticleCategory;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  readingMinutes: number;
  /** House byline — no individuals are invented. */
  author: string;
  cover: ArticleCover;
  /** Optional real photo URL. Rendered instead of the abstract cover art when set. */
  coverImage?: string;
  featured?: boolean;
  content: ContentBlock[];
};

/** Marks all current content as replaceable demo material for the UI. */
export const CONTENT_IS_DEMO = true;

export const categories: ArticleCategory[] = [
  "Investing",
  "Entrepreneurship",
  "Business Strategy",
  "Venture Building",
];

export const articles: Article[] = [
  {
    slug: "beyond-the-opportunity",
    title: "Beyond the Opportunity: What We Look for Before We Look at Returns",
    excerpt:
      "The most interesting question in any deal is rarely the one on the pitch deck. It's what the business could become in the hands of the right partners.",
    category: "Investing",
    date: "2026-07-22",
    readingMinutes: 6,
    author: "Rex Haven Ventures",
    cover: "arch",
    coverImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2jBMGphHmhBjECxumu_koZXoIsnboLjgTzi7d-f-upQ&s=10",
    featured: true,
    content: [
      {
        type: "p",
        text: "Every opportunity arrives dressed in its best numbers. The projections are clean, the market is enormous, and the timing is — of course — perfect. We've learned to read past the presentation. The businesses that endure are rarely the ones with the most polished forecast; they're the ones with the clearest sense of what they are trying to build and why.",
      },
      {
        type: "p",
        text: "So before we look at returns, we look at potential — the kind that isn't yet visible on a spreadsheet. We ask what the business could become with the right relationships, the right discipline, and enough time to compound.",
      },
      { type: "h2", text: "Three questions before the model" },
      {
        type: "p",
        text: "We tend to sit with three questions long before we open a valuation model. They are simple to ask and difficult to answer honestly.",
      },
      {
        type: "list",
        items: [
          "What is genuinely defensible here in three years — not three months?",
          "Do the people involved have the resilience to adapt when the plan meets reality?",
          "If we removed the hype, would we still find this a good business?",
        ],
      },
      {
        type: "quote",
        text: "We look beyond the opportunity. We look at what it can become.",
      },
      {
        type: "p",
        text: "None of this replaces rigor. Numbers matter, and we take them seriously. But they are the second conversation, not the first. The first conversation is about the shape of the thing being built — and whether we're the right people to help build it.",
      },
      { type: "h2", text: "Partnership as diligence" },
      {
        type: "p",
        text: "Some of the most valuable diligence we do happens in conversation. How a founder handles a hard question, where they're honest about risk, how they think about the people around them — these tell us more than most reports. When we decide to move forward, it's because we believe in both the opportunity and the partnership that will carry it.",
      },
    ],
  },
  {
    slug: "the-long-game",
    title: "The Long Game: Why Patience Is an Underrated Strategy",
    excerpt:
      "Short-term wins are easy to celebrate and easy to lose. Building for the long term is quieter — and far more valuable.",
    category: "Investing",
    date: "2026-06-10",
    readingMinutes: 5,
    author: "Rex Haven Ventures",
    cover: "ridge",
    coverImage:
      "https://static.vecteezy.com/system/resources/thumbnails/032/472/255/small/modern-business-office-building-urban-architecture-ai-generative-free-photo.jpg",
    content: [
      {
        type: "p",
        text: "Markets reward attention, and attention gravitates toward speed. There is always a faster exit, a quicker flip, a shinier metric to chase. But the businesses we admire most were built by people willing to be patient when patience was unfashionable.",
      },
      { type: "h2", text: "Compounding is quiet" },
      {
        type: "p",
        text: "The magic of compounding is that it looks unremarkable until, suddenly, it isn't. A business that improves a little every quarter can look ordinary for years and then become extraordinary. The discipline is in staying committed through the ordinary stretch.",
      },
      {
        type: "quote",
        text: "The best returns are usually the result of decisions no one applauded at the time.",
      },
      {
        type: "p",
        text: "Patience isn't passivity. It's a deliberate choice to optimize for durability over drama — to build relationships, reputation, and capabilities that outlast any single cycle.",
      },
    ],
  },
  {
    slug: "founders-first-hire",
    title: "The Founder's First Real Test Isn't the Product",
    excerpt:
      "Most first-time founders assume the hardest part is building the thing. More often, it's building the discipline to keep building it.",
    category: "Entrepreneurship",
    date: "2026-05-18",
    readingMinutes: 7,
    author: "Rex Haven Ventures",
    cover: "orbit",
    coverImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsGaGUJUx3b7YxzJwwX327UImv7S5geK-qGwqsen3_YBWRT0jbK3mlRVUR&s=10",
    content: [
      {
        type: "p",
        text: "There's a moment, usually somewhere after the initial excitement fades, when a founder discovers what they're actually made of. The product is half-built, the early enthusiasm has cooled, and the real work — unglamorous, repetitive, essential — begins.",
      },
      { type: "h2", text: "Resilience is a skill, not a trait" },
      {
        type: "p",
        text: "We often talk about resilience as though some people simply have it. In our experience it's closer to a practice: a set of habits that let founders absorb setbacks without losing momentum. The founders who last aren't the ones who never doubt — they're the ones who keep moving anyway.",
      },
      {
        type: "list",
        items: [
          "They separate the decision from the emotion around it.",
          "They shorten the distance between a mistake and the lesson.",
          "They surround themselves with people who tell them the truth.",
        ],
      },
      {
        type: "quote",
        text: "Great businesses are built through execution, resilience, and adaptability.",
      },
      { type: "h2", text: "Where a partner helps" },
      {
        type: "p",
        text: "This is precisely where the right partner earns their place. Not by taking the wheel, but by offering perspective at the moments when perspective is hardest to find on your own. A good partner has seen the pattern before, and can help a founder recognize that a hard week is not the end of the story.",
      },
    ],
  },
  {
    slug: "capital-meets-execution",
    title: "Where Capital Meets Execution",
    excerpt:
      "Capital opens doors. Execution decides what happens once you walk through them. The two are far more connected than they appear.",
    category: "Venture Building",
    date: "2026-04-02",
    readingMinutes: 6,
    author: "Rex Haven Ventures",
    cover: "column",
    coverImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2MySnbxole2g0_LncDUoYx0OMstUEuh2XMA9gGDcMGjmADzRcswO0CFk&s=10",
    content: [
      {
        type: "p",
        text: "It's tempting to treat capital and execution as separate concerns — one belongs to investors, the other to operators. We see them as two halves of the same conversation. The way capital is structured shapes the way a business can execute, and the way a business executes determines whether that capital ever compounds.",
      },
      { type: "h2", text: "The gap between funding and building" },
      {
        type: "p",
        text: "Plenty of well-funded ideas never become good businesses. The gap is almost always execution: the daily, deliberate work of turning a plan into something real. Money can buy runway, but it can't buy judgment, focus, or the willingness to do the hard thing twice.",
      },
      {
        type: "quote",
        text: "We invest, we build, we win together.",
      },
      {
        type: "p",
        text: "That's why we prefer to be involved rather than adjacent. Being close to the building lets us put capital to work in ways that actually help — and lets us learn quickly when something needs to change.",
      },
    ],
  },
  {
    slug: "strategic-partnerships-that-last",
    title: "Building Strategic Partnerships That Actually Last",
    excerpt:
      "The strongest partnerships aren't defined by the deal that starts them. They're defined by what both sides choose to do afterward.",
    category: "Business Strategy",
    date: "2026-02-27",
    readingMinutes: 5,
    author: "Rex Haven Ventures",
    cover: "grid",
    coverImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTlsBY2rcAJ6tmY9tnTXUMWMa_GmRr8wUGb0Zncm1zq2FaavYzG-CAQF8qt&s=10",
    content: [
      {
        type: "p",
        text: "Partnerships are easy to announce and hard to sustain. The announcement is a beginning; everything that matters happens in the unglamorous months that follow, when both sides have to keep showing up.",
      },
      { type: "h2", text: "Aligned incentives, honestly examined" },
      {
        type: "p",
        text: "The healthiest partnerships are the ones where success genuinely benefits everyone involved. That sounds obvious, but it requires honesty at the outset about what each side needs — and a willingness to revisit the arrangement as circumstances change.",
      },
      {
        type: "list",
        items: [
          "Name what each side is optimizing for, out loud.",
          "Design for the case where things go well and the case where they don't.",
          "Treat trust as an asset that has to be maintained, not assumed.",
        ],
      },
      {
        type: "p",
        text: "When the incentives are aligned and the relationship is tended, partnerships stop being transactions and start becoming a source of compounding advantage.",
      },
    ],
  },
  {
    slug: "the-500-launchpad",
    title: "Venture Debt for the Rest of Us: Introducing the $500 Launchpad",
    excerpt:
      "We believe the most powerful investments are often the smallest — and the most focused. The $500 Launchpad is our answer to a problem no one talks about enough.",
    category: "Entrepreneurship",
    date: "2026-08-27",
    readingMinutes: 6,
    author: "Rex Haven Ventures",
    cover: "spark",
    coverImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzCdF8x-IYjWA5T8BNn96bcYYlR0T88kcLdQZjg7DLxF_eiwwUNAaTHkKg&s=10",
    content: [
      {
        type: "p",
        text: "Introducing The $500 Launchpad—because sometimes a business doesn't need a million dollars; it needs a strategic $500 to break through a bottleneck. This isn't a hand-out; it's a hand-up. We lend this capital specifically for high-impact, one-time uses: a targeted ad campaign, a bulk inventory purchase, a essential piece of software, or a professional photoshoot that doubles conversion rates.",
      },
      {
        type: "h2",
        text: "Clear. Fast. Human.",
      },
      {
        type: "p",
        text: "No predatory interest spirals—just a simple, fixed 5% one-time fee, a 90-day repayment term, and a 5-minute video application where you tell us your 'one-thing' goal. We feature each borrower on our 'Progress Wall,' celebrating wins and sharing lessons. We succeed only when you use that $500 to generate $750 in new revenue—and we'll provide a free calculator to help you project that ROI before you even apply.",
      },
      {
        type: "quote",
        text: "This is venture debt for the rest of us.",
      },
      {
        type: "h2",
        text: "Why we built this",
      },
      {
        type: "p",
        text: "Most conversations about capital start with a big number. A round, a fund, a check that clears with ceremony. But if you spend enough time with small business owners, you learn that the problem is rarely a lack of ambition. It's a lack of a specific kind of capital — the kind that fits a specific bottleneck, arrives quickly, and doesn't require a ten-slide pitch deck or a board meeting to unlock.",
      },
      {
        type: "p",
        text: "There's a quiet gap in the market that almost no one addresses. It sits between the credit card you're afraid to max out and the bank loan that requires two years of financials you don't have. Inside that gap lives a perfectly reasonable request: I need $500 to buy inventory that will sell in three weeks, or to fund an ad campaign that will pay for itself in a month, or to buy the software that will cut my admin time in half.",
      },
      {
        type: "list",
        items: [
          "Fixed 5% one-time fee — no predatory interest spirals, no hidden costs.",
          "90-day repayment term aligned with your revenue cycle.",
          "5-minute video application to share your one-thing goal.",
          "Free ROI calculator to project returns before you apply.",
          "Progress Wall feature to celebrate wins and share lessons.",
        ],
      },
      {
        type: "h2",
        text: "The Progress Wall",
      },
      {
        type: "p",
        text: "We're serious about the Progress Wall. Every borrower who successfully turns that $500 into new revenue gets featured. We share wins, and we share lessons. Because the goal isn't just to lend money — it's to prove that small, strategic capital, when placed with intention, can generate outsized returns.",
      },
      {
        type: "h2",
        text: "Who this is for",
      },
      {
        type: "p",
        text: "We've watched too many promising businesses stall not because they lacked vision, but because they lacked a small bridge at the right moment. The Launchpad is our way of building that bridge. We succeed only when you use that $500 to generate $750 in new revenue. That alignment matters to us. It's venture debt — just a lot more accessible, and a lot more human.",
      },
      {
        type: "p",
        text: "If you've ever looked at a clear opportunity and thought, I just need a little capital to make this work — we want to hear from you. That's exactly who this is for.",
      },
    ],
  },
  {
    slug: "reading-a-market-early",
    title: "Reading a Market Before It's Obvious",
    excerpt:
      "By the time an opportunity is obvious, it's usually crowded. The interesting work is in seeing what others haven't priced in yet.",
    category: "Business Strategy",
    date: "2025-12-15",
    readingMinutes: 6,
    author: "Rex Haven Ventures",
    cover: "wave",
    coverImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEqDsAwx9650eVZvMtTOslTLuqOMYZuhwfoDHRVMklO99b2k29kdRgt4s&s=10",
    content: [
      {
        type: "p",
        text: "Every market looks inevitable in hindsight. The challenge is forming a view while the picture is still unclear — and having the conviction to act before the consensus arrives.",
      },
      { type: "h2", text: "Signals over noise" },
      {
        type: "p",
        text: "We spend less time reacting to headlines and more time watching for quieter signals: shifts in how people behave, small changes in what customers are willing to pay for, the friction that a new approach could remove. These rarely make news, but they often precede it.",
      },
      {
        type: "quote",
        text: "Focus on sustainable value rather than short-term wins.",
      },
      {
        type: "p",
        text: "Reading a market early is not about prediction for its own sake. It's about positioning — being ready, and being partnered with the right people, so that when the opportunity does become clear, you're already in motion.",
      },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getFeaturedArticle(): Article {
  return articles.find((a) => a.featured) ?? articles[0];
}

/** All non-featured articles, newest first. */
export function getListedArticles(): Article[] {
  const featured = getFeaturedArticle();
  return articles
    .filter((a) => a.slug !== featured.slug)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getRelatedArticles(slug: string, limit = 2): Article[] {
  const current = getArticle(slug);
  if (!current) return articles.slice(0, limit);
  const sameCategory = articles.filter(
    (a) => a.slug !== slug && a.category === current.category,
  );
  const others = articles.filter(
    (a) => a.slug !== slug && a.category !== current.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export function formatArticleDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
