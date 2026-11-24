import { type InjectOutput, type Scenario } from '../../src/utils/api-types';
import InjectorContractApiHelpers from '../api-helpers/InjectorContractApiHelpers';
import ScenarioApiHelpers from '../api-helpers/ScenarioApiHelpers';
import { newRequestContextAs } from '../utils/auth';
import assetFixture from './asset.fixture';

type ScenarioWithInject = {
  scenario: Scenario;
  inject: InjectOutput;
};

type ScenarioFixtures = {
  emptyScenario: Scenario;
  createScenarioWithInject: (name: string, assetIds: string[]) => Promise<ScenarioWithInject>;
};

// Extends assetFixture so that createScenarioWithInject can depend on createAsset.
const scenarioFixture = assetFixture.extend<ScenarioFixtures>({

  emptyScenario: async ({ request }, use) => {
    const scenarioApiHelpers = new ScenarioApiHelpers(request);
    const scenario = await scenarioApiHelpers.createScenario();

    await use(scenario);

    await scenarioApiHelpers.deleteScenario(scenario.scenario_id);
  },

  // Seeded as admin whatever the test persona: a read-only persona cannot create a scenario.
  // Depends on createAsset so that Playwright tears the scenario down before the assets its inject targets.
  createScenarioWithInject: async ({ playwright, createAsset: _createAsset }, use) => {
    const adminRequest = await newRequestContextAs(playwright, 'admin');
    const scenarioApiHelpers = new ScenarioApiHelpers(adminRequest);
    const contractApiHelpers = new InjectorContractApiHelpers(adminRequest);
    const scenarioIds: string[] = [];
    const contractIds: string[] = [];

    const createScenarioWithInject = async (name: string, assetIds: string[]) => {
      const scenario: Scenario = await scenarioApiHelpers.createScenario(name);
      scenarioIds.push(scenario.scenario_id);
      // Custom contract on the built-in manual injector: never executed, independent from external injectors.
      const { contractId, injectorId } = await contractApiHelpers.createContract(`E2E contract ${name}`, undefined, true);
      contractIds.push(contractId);
      const inject = await scenarioApiHelpers.createInject(scenario.scenario_id, {
        inject_title: `Inject ${name}`,
        inject_injector_contract: contractId,
        inject_injector: injectorId,
        inject_content: {},
        inject_assets: assetIds,
        // Required on a scenario inject (its offset from the scenario start), unlike an atomic testing.
        inject_depends_duration: 0,
      });
      return {
        scenario,
        inject,
      };
    };

    await use(createScenarioWithInject);

    // Deleting a scenario deletes its injects, which release the contracts.
    await Promise.all(scenarioIds.map(id => scenarioApiHelpers.deleteScenario(id)));
    await Promise.all(contractIds.map(id => contractApiHelpers.deleteContract(id)));
    await adminRequest.dispose();
  },
});

export default scenarioFixture;
