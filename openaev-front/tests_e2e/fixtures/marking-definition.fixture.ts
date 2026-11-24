import { test as base } from '@playwright/test';

import { type MarkingDefinitionOutput } from '../../src/utils/api-types';
import MarkingDefinitionApiHelpers from '../api-helpers/MarkingDefinitionApiHelpers';
import { newRequestContextAs } from '../utils/auth';

type MarkingDefinitionFixture = {
  markingDefinitions: MarkingDefinitionOutput[];
  getMarkingDefinitionId: (definition: string) => string;
};

const markingDefinitionFixture = base.extend<MarkingDefinitionFixture>({

  // Listed as admin whatever the test persona: /assignable is narrowed to the caller's clearance,
  // so a lower persona would not see the markings above its own.
  markingDefinitions: async ({ playwright }, use) => {
    const adminRequest = await newRequestContextAs(playwright, 'admin');
    const markingDefinitions = await new MarkingDefinitionApiHelpers(adminRequest).listAssignable();
    await adminRequest.dispose();
    await use(markingDefinitions);
  },

  // Fails in Arrange when a seeded marking is renamed, instead of a misleading assertion later.
  getMarkingDefinitionId: async ({ markingDefinitions }, use) => {
    await use((definition: string) => {
      const markingDefinition = markingDefinitions.find(m => m.marking_definition_definition === definition);
      if (!markingDefinition) {
        throw new Error(`Marking definition ${definition} not found`);
      }
      return markingDefinition.marking_definition_id;
    });
  },
});

export default markingDefinitionFixture;
