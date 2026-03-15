/**
 *    ▄▄▄▄
 *  ▄█▀▀███▄▄              █▄
 *  ██    ██ ▄             ██
 *  ██    ██ ████▄▄█▀█▄ ▄████ ▄█▀█▄▀██ ██▀
 *  ██  ▄ ██ ██   ██▄█▀ ██ ██ ██▄█▀  ███
 *   ▀█████▄▄█▀  ▄▀█▄▄▄▄█▀███▄▀█▄▄▄▄██ ██▄
 *        ▀█
 *
 *  Copyright (C) 2026 — 2026, Qredex, LTD. All Rights Reserved.
 *
 *  DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 *  Licensed under the Apache License, Version 2.0. See LICENSE for the full license text.
 *  You may not use this file except in compliance with that License.
 *  Unless required by applicable law or agreed to in writing, software distributed under the
 *  License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
 *  either express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

import { expect, test } from '@playwright/test';

test('bundle-first example exercises the shipped customer path', async ({ page }) => {
  await page.goto('/examples/cdn/?qdx_intent=iit_12345678');

  await expect(page).toHaveURL(/\/examples\/cdn\/$/);
  await expect(page.locator('#status-iit')).not.toHaveText('Not present');

  await page.click('[data-add-product="crewneck"]');
  await expect(page.locator('#status-pit')).not.toHaveText('Not present');
  await expect(page.locator('#summary-units')).toHaveText('1');

  await page.reload();
  await expect(page.locator('#summary-units')).toHaveText('1');
  await expect(page.locator('#status-pit')).not.toHaveText('Not present');

  await page.click('[data-decrement-product="crewneck"]');
  await expect(page.locator('#summary-units')).toHaveText('0');
  await expect(page.locator('#status-pit')).toHaveText('Not present');
  await expect(page.locator('#cart-list')).toContainText('Your cart is empty.');

  const hasGlobal = await page.evaluate(() => Boolean(window.QredexAgent));
  expect(hasGlobal).toBe(true);
});

const wrapperExamples = [
  { label: 'React', path: '/examples/wrappers/react/' },
  { label: 'Vue', path: '/examples/wrappers/vue/' },
  { label: 'Svelte', path: '/examples/wrappers/svelte/' },
  { label: 'Angular', path: '/examples/wrappers/angular/' },
] as const;

for (const example of wrapperExamples) {
  test(`${example.label} wrapper example drives the live cart flow`, async ({ page }) => {
    test.setTimeout(20_000);

    await page.goto(`${example.path}?qdx_intent=iit_12345678`);

    await expect(page.locator('h1')).toContainText(example.label, { timeout: 15_000 });
    await expect(page.locator('#status-iit')).not.toHaveText('Not present', { timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(`${example.path.replace(/\//g, '\\/')}$`), {
      timeout: 15_000,
    });
    await expect(page.locator('[data-add-product="crewneck"]')).toBeVisible();

    await page.click('[data-add-product="crewneck"]');
    await expect(page.locator('#summary-units')).toHaveText('1');
    await expect(page.locator('#status-pit')).not.toHaveText('Not present');

    await page.click('#empty-cart-button');
    await expect(page.locator('#summary-units')).toHaveText('0');
    await expect(page.locator('#status-pit')).toHaveText('Not present');
  });
}
