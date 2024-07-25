import { z } from 'zod';
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
    inputs.map((input, index) => {
      validateInput(input, index);
    });

    const firstTimestamp = inputs[0].timestamp;
    const endTimestamp = inputs[inputs.length - 1].timestamp;
    const endDuration = inputs[inputs.length - 1].duration;
    const { repo, branch, workflow } = config;
    const evaledDuration = eval(endDuration);
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

    const data = metrics.reduce(
      (acc: { energy: number; carbon: number }, item: number[]) => {
        const resetedTimeDate = item[3].toString().split('T')[0] + 'T00:00';
        const dateInMilliseconds = new Date(resetedTimeDate).getTime();
        const startRange = new Date(input.timestamp).getTime();
        const endRange = startRange + eval(input.duration);

        if (
          dateInMilliseconds >= new Date(input.timestamp).getTime() &&
          dateInMilliseconds <= endRange
        ) {
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
    startTimestamp: string,
    endTimestamp: string,
    duration: number
  ) => {
    const startDate = startTimestamp.split('T')[0];
    const endTimestampDate = endTimestamp.split('T')[0];
    const endTimestampDateInMilliseconds = new Date(endTimestampDate).getTime();
    const endDateInMilliseconds = new Date(
      duration + endTimestampDateInMilliseconds
    );
    const isoEndDate = new Date(
      endDateInMilliseconds.getTime() -
        endDateInMilliseconds.getTimezoneOffset() * 60000
    ).toISOString();
    const endDate = isoEndDate.split('T')[0];

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
    });

    return validate<z.infer<typeof schema>>(schema, globalConfig);
  };

  return {
    metadata,
    execute,
  };
};
