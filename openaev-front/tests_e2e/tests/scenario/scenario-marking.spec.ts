import { expect } from '@playwright/test';

import { test } from '../../fixtures';
import ScenarioPage from '../../model/scenario/ScenarioPage';
import { type Persona } from '../../utils/personas';

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

test.describe('Scenario - With asset marked', () => {
  for (const { persona, visibleAssets, invisibleAssets } of CASES) {
    test.describe(`as ${persona}`, () => {
      test.use({ persona });

      test('should list the inject targets corresponding with the correct marking', async ({ page, createAsset, createScenarioWithInject, getMarkingDefinitionId }) => {
        // Arrange
        const suffix = `${Date.now()}-${Math.random()}`;
        const assets = {
          green: await createAsset(`Asset Green ${suffix}`, [getMarkingDefinitionId('TLP:GREEN')]),
          amber: await createAsset(`Asset Amber ${suffix}`, [getMarkingDefinitionId('TLP:AMBER')]),
          red: await createAsset(`Asset Red ${suffix}`, [getMarkingDefinitionId('TLP:RED')]),
        };
        const { scenario, inject } = await createScenarioWithInject(`Scenario marking ${suffix}`, Object.values(assets).map(asset => asset.asset_id));
        const scenarioPage = new ScenarioPage(page);
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
        await scenarioPage.gotoInjects(scenario.scenario_id);
        await scenarioPage.openInject(inject.inject_title);

        // Assert
        await Promise.all(visibleAssets.map(key =>
          expect(scenarioPage.getInjectTargetAsset(assets[key].asset_name)).toBeVisible()));
        // Runs after the visible checks, so the list has rendered and an absence is meaningful.
        await Promise.all(invisibleAssets.map(key =>
          expect(scenarioPage.getInjectTargetAsset(assets[key].asset_name)).toHaveCount(0, { timeout: 1_000 })));
      });
    });
  }
});
