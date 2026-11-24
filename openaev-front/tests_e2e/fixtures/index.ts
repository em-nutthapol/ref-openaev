import { mergeTests } from '@playwright/test';

import assetFixture from './asset.fixture';
import authFixture from './auth.fixture';
import credentialFixture from './credential.fixture';
import markingDefinitionFixture from './marking-definition.fixture';
import scenarioFixture from './scenario.fixture';
import teamFixture from './team.fixture';

export const test = mergeTests(
  authFixture,
  teamFixture,
  assetFixture,
  scenarioFixture,
  credentialFixture,
  markingDefinitionFixture,
);
