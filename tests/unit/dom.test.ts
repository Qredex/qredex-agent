/**
 * Unit tests for DOM utilities.
 */

import { describe, it, expect } from 'vitest';
import { $, $$, isAddToCartElement, getText, isVisible } from '../../src/utils/dom.js';

describe('DOM Utilities', () => {
  describe('query selector', () => {
    it('should find element by selector', () => {
      document.body.innerHTML = '<div id="test">Hello</div>';

      const el = $('#test');
      expect(el).toBeTruthy();
      expect(el?.id).toBe('test');
    });

    it('should return null for non-existent selector', () => {
      const el = $('#nonexistent');
      expect(el).toBeNull();
    });

    it('should find multiple elements', () => {
      document.body.innerHTML = '<div class="item"></div><div class="item"></div>';

      const els = $$('.item');
      expect(els.length).toBe(2);
    });
  });

  describe('isAddToCartElement', () => {
    it('should detect data-add-to-cart attribute', () => {
      document.body.innerHTML = '<button data-add-to-cart>Add</button>';
      const btn = document.querySelector('button');
      expect(isAddToCartElement(btn)).toBe(true);
    });

    it('should detect add-to-cart class', () => {
      document.body.innerHTML = '<button class="add-to-cart">Add</button>';
      const btn = document.querySelector('button');
      expect(isAddToCartElement(btn)).toBe(true);
    });

    it('should detect add-to-cart name attribute', () => {
      document.body.innerHTML = '<button name="add-to-cart">Add</button>';
      const btn = document.querySelector('button');
      expect(isAddToCartElement(btn)).toBe(true);
    });

    it('should detect add to cart text', () => {
      document.body.innerHTML = '<button>Add to Cart</button>';
      const btn = document.querySelector('button');
      expect(isAddToCartElement(btn)).toBe(true);
    });

    it('should return false for regular button', () => {
      document.body.innerHTML = '<button>Submit</button>';
      const btn = document.querySelector('button');
      expect(isAddToCartElement(btn)).toBe(false);
    });
  });

  describe('getText', () => {
    it('should get trimmed text content', () => {
      document.body.innerHTML = '<div>  Hello World  </div>';
      const el = document.querySelector('div');
      expect(getText(el)).toBe('Hello World');
    });

    it('should return empty string for null', () => {
      expect(getText(null)).toBe('');
    });
  });
});
