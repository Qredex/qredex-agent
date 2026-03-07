/**
 * DOM utility functions for safe element querying and interaction.
 */

/**
 * Safely query a selector and return the element or null.
 */
export function $(selector: string, context: Document | Element = document): Element | null {
  try {
    return context.querySelector(selector);
  } catch {
    return null;
  }
}

/**
 * Safely query all matching selectors.
 */
export function $$(selector: string, context: Document | Element = document): Element[] {
  try {
    return Array.from(context.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/**
 * Check if an element matches a selector.
 */
export function matches(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

/**
 * Get the closest ancestor (or self) that matches a selector.
 */
export function closest(element: Element, selector: string): Element | null {
  try {
    return element.closest(selector);
  } catch {
    return null;
  }
}

/**
 * Get the text content of an element, trimmed.
 */
export function getText(element: Element | null): string {
  if (!element) return '';
  return (element.textContent || '').trim();
}

/**
 * Check if an element is visible (not hidden, not display:none).
 */
export function isVisible(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

/**
 * Get a form element from a potential submit target (button, input, form).
 */
export function getFormFromTarget(target: EventTarget | null): HTMLFormElement | null {
  if (!target || !(target instanceof Element)) return null;

  // If target is a form
  if (target.tagName === 'FORM') {
    return target as HTMLFormElement;
  }

  // If target is inside a form
  const form = closest(target, 'form');
  if (form) {
    return form as HTMLFormElement;
  }

  return null;
}

/**
 * Common add-to-cart button selectors (best-effort detection).
 */
export const CART_BUTTON_SELECTORS = [
  '[data-add-to-cart]',
  '[data-action="add-to-cart"]',
  '[data-type="add-to-cart"]',
  '.add-to-cart',
  '.add-to-cart-btn',
  '.btn-add-to-cart',
  'button[name="add"]',
  'button[name="add-to-cart"]',
  'input[name="add"]',
  'input[type="submit"][value*="Add"]',
  'button:contains("Add to Cart")',
];

/**
 * Check if an element looks like an add-to-cart trigger.
 */
export function isAddToCartElement(element: Element | null): boolean {
  if (!element) return false;

  // Check data attributes
  const hasDataAttr =
    element.hasAttribute('data-add-to-cart') ||
    element.getAttribute('data-action') === 'add-to-cart' ||
    element.getAttribute('data-type') === 'add-to-cart';

  if (hasDataAttr) return true;

  // Check class names
  const className = element.className || '';
  if (typeof className === 'string') {
    const classStr = className.toLowerCase();
    if (classStr.includes('add-to-cart') || classStr.includes('addtocart')) {
      return true;
    }
  }

  // Check button/input names
  const name = (element.getAttribute('name') || '').toLowerCase();
  if (name === 'add' || name === 'add-to-cart' || name === 'addtocart') {
    return true;
  }

  // Check button/input value
  const value = (element.getAttribute('value') || '').toLowerCase();
  if (value.includes('add to cart') || value.includes('add to bag')) {
    return true;
  }

  // Check text content for buttons
  const text = getText(element).toLowerCase();
  if (text.includes('add to cart') || text.includes('add to bag')) {
    return true;
  }

  return false;
}
