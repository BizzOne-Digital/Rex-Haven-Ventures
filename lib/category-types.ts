/**
 * Wire shape for categories. Pure types, no imports, shared by the route
 * handlers that produce them and the admin UI that consumes them.
 */

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  /** Posts currently carrying this category name, drafts included. */
  postCount: number;
  createdAt: string;
  updatedAt: string;
};
