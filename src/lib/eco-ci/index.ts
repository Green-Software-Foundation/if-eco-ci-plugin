import { z } from 'zod';
import moment from 'moment-timezone';
import { ERRORS, validate } from '@grnsft/if-core/utils';
import {
  PluginParams,
  ExecutePlugin,
  ConfigParams,
  PluginParametersMetadata,
} from '@grnsft/if-core/types';

import { EcoCiAPI } from './api';
import { EcoCiParams } from './types';

const { GlobalConfigError } = ERRORS;

export const EcoCI = (
  globalConfig: ConfigParams,
  parametersMetadata: PluginParametersMetadata
): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
    inputs: parametersMetadata?.inputs,
    outputs: parametersMetadata?.outputs || {
      carbon: {
        description: 'the used carbon in running the workflow',
        unit: 'gCO2eq',
        'aggregation-method': 'sum',
      },
      energy: {
        description: 'the used energy in running the workflow',
        unit: 'kWh',
        'aggregation-method': 'sum',
      },
    },
  };

  /**
   * Gets energy and carbon of the repository.
   */
  const execute = async (inputs: PluginParams[]) => {
    const validatedConfig = validateGlobalConfig();
    const result = await getRepoMetrics(validatedConfig, inputs);

    return inputs.map((input, index) => {
      validateInput(input, index);

      const { energy, carbon } = calculateMetrics(result, input);

      return {
        ...input,
        energy,
        carbon,
      };
    });
  };

  /**
   * Gets metrics for the specified repository.
   */
  const getRepoMetrics = async (
    config: ConfigParams,
    inputs: PluginParams[]
  ) => {
    const {
      repo,
      branch,
      workflow,
      'start-date': start,
      'end-date': end,
    } = config;

    inputs.map((input, index) => {
      validateInput(input, index);
    });

    const firstTimestamp = start || inputs[0].timestamp;
    const endTimestamp =
      start && !end ? start : end || inputs[inputs.length - 1].timestamp;
    const evaledDuration = eval(inputs[inputs.length - 1]?.duration);

    const { startDate, endDate } = getOnlyDates(
      firstTimestamp,
      endTimestamp,
      evaledDuration
    );
    const params: EcoCiParams = {
      repo,
      branch,
      workflow,
      start_date: startDate || firstTimestamp,
      end_date: endDate,
    };

    return await EcoCiAPI().getRepoMetrics(params);
  };

  /**
   * Calculates the energy and carbon metrics.
   * Converts energy from `mJ` to `kWh`.
   */
  const calculateMetrics = (metrics: [], input: PluginParams) => {
    const kWhForJ = 2.78e-8;
    const { 'start-date': startDate, 'end-date': endDate } = globalConfig;

    const data = metrics.reduce(
      (acc: { energy: number; carbon: number }, item: number[]) => {
        const dateInMilliseconds = moment
          .tz(item[3].toString(), 'UTC')
          .toDate()
          .getTime();
        const startRange = moment.utc(startDate || input.timestamp).valueOf();
        const endRange = endDate
          ? moment.utc(endDate).valueOf()
          : startRange + eval(input.duration) * 1000;

        if (dateInMilliseconds >= startRange && dateInMilliseconds < endRange) {
          acc.energy += item[0];
          acc.carbon += parseFloat(item[item.length - 1].toString());
          return acc;
        }

        return { energy: acc.energy, carbon: acc.carbon };
      },
      { energy: 0, carbon: 0 }
    );

    data.energy = (data.energy / 1000) * kWhForJ;

    return data;
  };

  /**
   * Drops time part and returns only dates.
   */
  const getOnlyDates = (
    startDate: string,
    endDate: string,
    duration: number
  ) => {
    const startTimestampSeconds = new Date(startDate).getTime() / 1000;
    const endTimestampSeconds = new Date(endDate).getTime() / 1000;
    const range = endTimestampSeconds - startTimestampSeconds;

    if (range === 0) {
      const endDateInMilliseconds = (duration + endTimestampSeconds) * 1000;
      endDate = new Date(
        endDateInMilliseconds - new Date().getTimezoneOffset() * 60000
      ).toISOString();
    }

    return {
      startDate,
      endDate,
    };
  };

  /**
   * Validates single input data.
   */
  const validateInput = (input: PluginParams, index: number) => {
    const schema = z.object({
      timestamp: z
        .string({
          required_error: `required in input[${index}]`,
        })
        .or(z.date()),
      duration: z.number().or(z.string()),
    });

    return validate<z.infer<typeof schema>>(schema, input);
  };

  /**
   * Checks if global config value are valid.
   */
  const validateGlobalConfig = () => {
    if (!globalConfig) {
      throw new GlobalConfigError('Global config is not provided.');
    }

    const schema = z.object({
      repo: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/),
      branch: z.string(),
      workflow: z.number(),
      'start-date': z.string().or(z.date()).optional(),
      'end-date': z.string().or(z.date()).optional(),
    });

    return validate<z.infer<typeof schema>>(schema, globalConfig);
  };

  return {
    metadata,
    execute,
  };
};
