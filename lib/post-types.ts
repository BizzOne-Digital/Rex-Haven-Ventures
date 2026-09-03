/**
 * Wire shape for blog posts in the admin UI. Pure types, no imports, so both
 * the route handlers and the client editor can rely on it.
 */

export type AdminPostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export type AdminPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingMinutes: number;
  author: string;
  cover: string;
  coverImage: string;
  tags: string[];
  featured: boolean;
  status: string;
  content: AdminPostBlock[];
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
};

export type PostCounts = {
  total: number;
  published: number;
  drafts: number;
};
