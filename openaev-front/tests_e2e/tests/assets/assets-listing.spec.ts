import { expect } from '@playwright/test';

import { test } from '../../fixtures';
import EndpointListPage from '../../model/assets/EndpointListPage';
import { type Persona } from '../../utils/personas';
import { tenantUrl } from '../../utils/url';

type AssetKey = 'green' | 'amber' | 'red';

// Default group clearances (PresetTenantData.DEFAULT_GROUP_MARKINGS): Admin TLP:RED, Manager TLP:AMBER,
// Observer TLP:GREEN. A clearance also covers every lower marking of the same type.
const CASES: {
  persona: Persona;
  visibleAssets: AssetKey[];
  invisibleAssets: AssetKey[];
}[] = [
  {
    persona: 'admin',
    visibleAssets: ['green', 'amber', 'red'],
    invisibleAssets: [],
  },
  {
    persona: 'manager',
    visibleAssets: ['green', 'amber'],
    invisibleAssets: ['red'],
  },
  {
    persona: 'observer',
    visibleAssets: ['green'],
    invisibleAssets: ['amber', 'red'],
  },
];

test.describe('Assets - Listing', () => {
  for (const { persona, visibleAssets, invisibleAssets } of CASES) {
    test.describe(`as ${persona}`, () => {
      test.use({ persona });

      test('should list assets corresponding with the correct marking', async ({ page, createAsset, getMarkingDefinitionId }) => {
        // Arrange
        const suffix = `${Date.now()}-${Math.random()}`;
        const assets = {
          green: await createAsset(`Asset Green ${suffix}`, [getMarkingDefinitionId('TLP:GREEN')]),
          amber: await createAsset(`Asset Amber ${suffix}`, [getMarkingDefinitionId('TLP:AMBER')]),
          red: await createAsset(`Asset Red ${suffix}`, [getMarkingDefinitionId('TLP:RED')]),
        };
        const endpointListPage = new EndpointListPage(page);
        await page.addInitScript(() => {
          const style = document.createElement('style');
          style.innerHTML = `
            *, *::before, *::after {
              transition: none !important;
              animation: none !important;
            }
          `;
          document.head.appendChild(style);
        });

        // Act
        await page.goto(tenantUrl('/admin/assets'));
        await endpointListPage.waitForLoad();

        // Assert
        await Promise.all(visibleAssets.map(key =>
          expect(endpointListPage.getEndpointByName(assets[key].asset_name)).toBeVisible()));
        // Runs after the visible checks, so the list has rendered and an absence is meaningful.
        await Promise.all(invisibleAssets.map(key =>
          expect(endpointListPage.getEndpointByName(assets[key].asset_name)).toHaveCount(0, { timeout: 1_000 })));
      });
    });
  }
});
