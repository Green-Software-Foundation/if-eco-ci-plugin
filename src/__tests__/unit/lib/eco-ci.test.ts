import axios from 'axios';
import { ERRORS } from '@grnsft/if-core/utils';

import { EcoCI } from '../../../lib/eco-ci';

import { getMockRepoMetrics } from '../../../__mocks__/api';

jest.mock('axios');

const mockAxios = axios as jest.Mocked<typeof axios>;
const { InputValidationError, GlobalConfigError } = ERRORS;

mockAxios.get.mockImplementation(getMockRepoMetrics);

describe('lib/eco-ci: ', () => {
  describe('EcoCI(): ', () => {
    const config = {
      repo: 'Green-Software-Foundation/if',
      branch: 'main',
      workflow: 66389738,
    };
    const parametersMetadata = {
      inputs: {},
      outputs: {},
    };

    it('has metadata field.', () => {
      const ecoCi = EcoCI({}, parametersMetadata);

      expect.assertions(4);
      expect(ecoCi).toHaveProperty('metadata');
      expect(ecoCi).toHaveProperty('execute');
      expect(ecoCi.metadata).toHaveProperty('kind');
      expect(typeof ecoCi.execute).toBe('function');
    });

    describe('execute(): ', () => {
      it('executes with the correct data.', async () => {
        const ecoCi = EcoCI(config, parametersMetadata);
        const inputs = [
          {
            timestamp: '2024-07-05T00:00',
            duration: 126000,
          },
        ];

        const response = await ecoCi.execute(inputs);
        expect.assertions(3);

        expect(response).toBeInstanceOf(Array);

        response.forEach((item) => {
          expect(item).toHaveProperty('energy');
          expect(item).toHaveProperty('carbon');
        });
      });

      it('throws an error when config is an empty object.', async () => {
        const ecoCi = EcoCI({}, parametersMetadata);
        const inputs = [
          {
            timestamp: '2024-07-05T00:00',
            duration: 126000,
          },
        ];

        expect.assertions(2);
        try {
          await ecoCi.execute(inputs);
        } catch (error) {
          if (error instanceof Error) {
            expect(error).toBeInstanceOf(InputValidationError);
            expect(error.message).toEqual(
              '"repo" parameter is required. Error code: invalid_type.,"branch" parameter is required. Error code: invalid_type.,"workflow" parameter is required. Error code: invalid_type.'
            );
          }
        }
      });

      it('throws an error when config is not provided.', async () => {
        const config = undefined;
        const ecoCi = EcoCI(config!, parametersMetadata);

        expect.assertions(2);
        try {
          await ecoCi.execute([]);
        } catch (error) {
          if (error instanceof Error) {
            expect(error).toBeInstanceOf(GlobalConfigError);
            expect(error.message).toEqual('Global config is not provided.');
          }
        }
      });
    });
  });
});
