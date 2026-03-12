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
 *  This file is part of the Qredex Agent SDK and is licensed under the MIT License. See LICENSE.
 *  Redistribution and use are permitted under that license.
 *
 *  If you need additional information or have any questions, please email: copyright@qredex.com
 */

import { expect, test } from '@playwright/test';

test('bundle-first example exercises the shipped customer path', async ({ page }) => {
  await page.goto('/examples/cdn.html?qdx_intent=iit_12345678');

  await expect(page).toHaveURL(/\/examples\/cdn\.html$/);
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
