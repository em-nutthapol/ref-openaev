import { test as base } from '@playwright/test';

import { type Endpoint } from '../../src/utils/api-types';
import EndpointsApiHelpers from '../api-helpers/EndpointsApiHelpers';
import { newRequestContextAs } from '../utils/auth';

type AssetFixture = { createAsset: (name: string, markings: string[]) => Promise<Endpoint> };

const assetFixture = base.extend<AssetFixture>({

  // Assets are seeded as admin whatever the test persona: a read-only persona cannot create them.
  createAsset: async ({ playwright }, use) => {
    const adminRequest = await newRequestContextAs(playwright, 'admin');
    const endpointApiHelpers = new EndpointsApiHelpers(adminRequest);
    const endpointsCreated: Endpoint[] = [];

    const createAsset = async (name: string, markings: string[]) => {
      const endpoint = await endpointApiHelpers.createEndpoint(name, markings);
      endpointsCreated.push(endpoint);
      return endpoint;
    };

    await use(createAsset);

    await Promise.all(endpointsCreated.map(endpoint => endpointApiHelpers.deleteEndpoint(endpoint.asset_id)));
    await adminRequest.dispose();
  },
});

export default assetFixture;
