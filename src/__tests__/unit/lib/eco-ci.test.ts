import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import {ERRORS} from '@grnsft/if-core/utils';

import {EcoCI} from '../../../lib';

const {ConfigError} = ERRORS;
const mock = new AxiosMockAdapter(axios);

describe('lib/eco-ci: ', () => {
  afterEach(() => {
    mock.reset();
  });

  describe('EcoCI(): ', () => {
    const config = {
      repo: 'Green-Software-Foundation/if',
      branch: 'main',
      workflow: 66389738,
      'start-date': '2024-07-24',
      'end-date': '2024-07-25',
    };
    const parametersMetadata = {
      inputs: {},
      outputs: {},
    };

    const responseData = [
      [
        3123,
        'mJ',
        '10074332144',
        '2024-07-24T09:43:38.428708+00:00',
        'checkout',
        'EPYC_7763',
        '72db420085ca7a904bc264ff3bcfb54d6a35b4c8',
        1,
        'github',
        4,
        'Node.js CI',
        '',
        '',
        '',
        '419',
        '0.001593851',
      ],
      [
        81767,
        'mJ',
        '10074332144',
        '2024-07-24T09:43:55.393999+00:00',
        'npm install',
        'EPYC_7763',
        '72db420085ca7a904bc264ff3bcfb54d6a35b4c8',
        17,
        'github',
        48,
        'Node.js CI',
        '',
        '',
        '',
        '419',
        '0.039110708',
      ],
      [
        12269,
        'mJ',
        '10076956150',
        '2024-07-24T12:50:21.294476+00:00',
        'checkout',
        'EPYC_7763',
        '8537a3e54c3c540872e3f48094fc66f3abb30761',
        3,
        'github',
        25,
        'Node.js CI',
        '',
        '',
        '',
        '436',
        '0.006205225',
      ],
      [
        71228,
        'mJ',
        '10076956150',
        '2024-07-24T12:50:35.522413+00:00',
        'setup node',
        'EPYC_7763',
        '8537a3e54c3c540872e3f48094fc66f3abb30761',
        14,
        'github',
        54,
        'Node.js CI',
        '',
        '',
        '',
        '436',
        '0.035049801',
      ],
    ];

    it('has metadata field.', () => {
      const ecoCi = EcoCI({}, parametersMetadata, {});

      expect.assertions(3);
      expect(ecoCi).toHaveProperty('metadata');
      expect(ecoCi).toHaveProperty('execute');
      expect(typeof ecoCi.execute).toBe('function');
    });

    describe('execute(): ', () => {
      it('executes with the correct data.', async () => {
        const ecoCi = EcoCI(config, parametersMetadata, {});
        const inputs = [
          {
            timestamp: '2024-07-24T00:00',
            duration: 24 * 60 * 60,
          },
        ];

        mock
          .onGet('https://api.green-coding.io/v1/ci/measurements', config)
          .reply(200, {
            success: true,
            data: responseData,
          });
        const response = await ecoCi.execute(inputs);
        expect.assertions(3);

        expect(response).toBeInstanceOf(Array);

        response.forEach((item: any) => {
          expect(item).toHaveProperty('energy', 0.0000046811586);
          expect(item).toHaveProperty('carbon', 0.081959585);
        });
      });

      it('successfully executes when the mapping maps output parameters.', async () => {
        const mapping = {
          energy: 'energy-used-in-if-main',
          carbon: 'carbon-used-in-if-main',
        };
        const ecoCi = EcoCI(config, parametersMetadata, mapping);
        const inputs = [
          {
            timestamp: '2024-07-24T00:00',
            duration: 24 * 60 * 60,
          },
        ];

        mock
          .onGet('https://api.green-coding.io/v1/ci/measurements', config)
          .reply(200, {
            success: true,
            data: responseData,
          });
        const response = await ecoCi.execute(inputs);
        expect.assertions(3);

        expect(response).toBeInstanceOf(Array);

        response.forEach((item: any) => {
          expect(item).toHaveProperty(
            'energy-used-in-if-main',
            0.0000046811586
          );
          expect(item).toHaveProperty('carbon-used-in-if-main', 0.081959585);
        });
      });

      it('executes when the time range is smaller than the API data time range.', async () => {
        const config = {
          repo: 'Green-Software-Foundation/if',
          branch: 'main',
          workflow: 66389738,
        };
        const ecoCi = EcoCI(config, parametersMetadata, {});
        const inputs = [
          {
            timestamp: '2024-07-24T10:00',
            duration: 11 * 60 * 60,
          },
        ];

        mock
          .onGet('https://api.green-coding.io/v1/ci/measurements', config)
          .reply(200, {
            success: true,
            data: responseData,
          });
        const response = await ecoCi.execute(inputs);
        expect.assertions(3);

        expect(response).toBeInstanceOf(Array);

        response.forEach((item: any) => {
          expect(item).toHaveProperty('energy', 0.0000023212166);
          expect(item).toHaveProperty('carbon', 0.041255026);
        });
      });

      it('executes when `end-date` is missing and `start-date` persists.', async () => {
        const config = {
          repo: 'Green-Software-Foundation/if',
          branch: 'main',
          workflow: 66389738,
          'start-date': '2024-07-24',
        };
        const ecoCi = EcoCI(config, parametersMetadata, {});
        const inputs = [
          {
            timestamp: '2024-07-24T10:00',
            duration: 11 * 60 * 60,
          },
        ];

        mock
          .onGet('https://api.green-coding.io/v1/ci/measurements', config)
          .reply(200, {
            success: true,
            data: responseData,
          });
        const response = await ecoCi.execute(inputs);
        expect.assertions(3);

        expect(response).toBeInstanceOf(Array);

        response.forEach((item: any) => {
          expect(item).toHaveProperty('energy', 0.000002359942);
          expect(item).toHaveProperty('carbon', 0.040704559);
        });
      });

      it('throws an error when config is not provided.', async () => {
        const ecoCi = EcoCI({}, parametersMetadata, {});
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
            expect(error).toBeInstanceOf(ConfigError);
            expect(error.message).toEqual('Config is not provided.');
          }
        }
      });
    });
  });
});
