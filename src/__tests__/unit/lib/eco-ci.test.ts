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
        103657000,
        '10038772190',
        '2024-07-24T10:05:58.502999+00:00',
        'npm run test',
        'EPYC_7763',
        '4fdd48fbe29c0fe2bca1687cb6dc00c6c59953d6',
        16000000,
        'github',
        83,
        'Node.js CI',
        '',
        '',
        '',
        440,
        50174.100999999995,
      ],
      [
        7555000,
        '10076959587',
        '2024-07-24T12:50:29.829836+00:00',
        'checkout',
        'EPYC_7763',
        '78474c5c73b9243e0670e0febf68bcaa8fae7e7b',
        3000000,
        'github',
        15,
        'Node.js CI',
        '',
        '',
        '',
        436,
        4149.921,
      ],
      [
        30795000,
        '10076959587',
        '2024-07-24T12:50:36.316414+00:00',
        'setup node',
        'EPYC_7763',
        '78474c5c73b9243e0670e0febf68bcaa8fae7e7b',
        7000000,
        'github',
        46,
        'Node.js CI',
        '',
        '',
        '',
        436,
        15423.817,
      ],
      [
        76773000,
        '10076959587',
        '2024-07-24T12:50:52.764154+00:00',
        'npm install',
        'EPYC_7763',
        '78474c5c73b9243e0670e0febf68bcaa8fae7e7b',
        16000000,
        'github',
        47,
        'Node.js CI',
        '',
        '',
        '',
        436,
        38038.049,
      ],
      [
        19496000,
        '10076959587',
        '2024-07-24T12:50:58.061916+00:00',
        'npm run lint',
        'EPYC_7763',
        '78474c5c73b9243e0670e0febf68bcaa8fae7e7b',
        5000000,
        'github',
        41,
        'Node.js CI',
        '',
        '',
        '',
        436,
        9926.825,
      ],
      [
        104229000,
        '10076959587',
        '2024-07-24T12:51:14.416017+00:00',
        'npm run test',
        'EPYC_7763',
        '78474c5c73b9243e0670e0febf68bcaa8fae7e7b',
        16000000,
        'github',
        83,
        'Node.js CI',
        '',
        '',
        '',
        436,
        50008.865,
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
          expect(item).toHaveProperty('energy', 0.000009521639);
          expect(item).toHaveProperty('carbon', 0.16772157799999998);
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
          expect(item).toHaveProperty('energy-used-in-if-main', 0.000009521639);
          expect(item).toHaveProperty(
            'carbon-used-in-if-main',
            0.16772157799999998
          );
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
          expect(item).toHaveProperty('energy', 0.000009521639);
          expect(item).toHaveProperty('carbon', 0.16772157799999998);
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
            timestamp: '2024-07-24T09:00',
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
          expect(item).toHaveProperty('energy', 0.0000028816645999999998);
          expect(item).toHaveProperty('carbon', 0.05017410099999999);
        });
      });

      it('returns 0 when there is not data for given time range.', async () => {
        const config = {
          repo: 'Green-Software-Foundation/if',
          branch: 'main',
          workflow: 66389738,
        };
        const ecoCi = EcoCI(config, parametersMetadata, {});
        const inputs = [
          {
            timestamp: '2024-07-25T10:00',
            duration: 10 * 60 * 60,
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
          expect(item).toHaveProperty('energy', 0);
          expect(item).toHaveProperty('carbon', 0);
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
