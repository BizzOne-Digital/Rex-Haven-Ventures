/**
 * Shared category validation, used by the admin form and the API.
 * No framework imports; safe on both sides.
 */

export type CategoryValues = {
  name: string;
  slug: string;
  description: string;
  order: string;
};

export type CategoryFieldErrors = Partial<Record<keyof CategoryValues, string>>;

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const DESCRIPTION_MAX = 300;

export const emptyCategoryValues: CategoryValues = {
  name: "",
  slug: "",
  description: "",
  order: "0",
};

const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidCategorySlug(slug: string): boolean {
  return slugRe.test(slug) && slug.length <= 80;
}

export function validateCategory(values: Partial<CategoryValues>): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};
  const v = { ...emptyCategoryValues, ...values };

  const name = v.name.trim();
  if (!name) {
    errors.name = "Please enter a category name.";
  } else if (name.length < NAME_MIN) {
    errors.name = "That name looks a little short.";
  } else if (name.length > NAME_MAX) {
    errors.name = `Please keep the name under ${NAME_MAX} characters.`;
  }

  const slug = v.slug.trim();
  if (!slug) {
    errors.slug = "Please add a URL slug.";
  } else if (!isValidCategorySlug(slug)) {
    errors.slug = "Use lowercase letters, numbers and single hyphens (e.g. venture-building).";
  }

  if (v.description.trim().length > DESCRIPTION_MAX) {
    errors.description = `Please keep the description under ${DESCRIPTION_MAX} characters.`;
  }

  const order = Number(v.order);
  if (!Number.isFinite(order) || order < 0 || order > 999) {
    errors.order = "Order must be a number between 0 and 999.";
  }

  return errors;
}

export function hasCategoryErrors(errors: CategoryFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
