import axios from 'axios';
import { ERRORS } from '@grnsft/if-core/utils';

import { EcoCiParams } from './types';

const { APIRequestError } = ERRORS;

export const EcoCiAPI = () => {
  /**
   * Gets energy and carbon of the specified repo workflow.
   */
  const getRepoMetrics = async (params: EcoCiParams) => {
    try {
      const result = await axios.get(
        'https://api.green-coding.io/v1/ci/measurements',
        { params }
      );

      // In case of status 204, the API returns `statusText: No Content` and the `data: undefined`
      if (result.status == 204) {
        return [];
      }

      if (!result?.data?.success) {
        throw new Error(
          `Error fetching dara from EcoCI API. ${
            result?.data?.data.statusText || result?.statusText
          }`
        );
      }

      return result?.data?.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.err[0]?.msg;

      throw new APIRequestError(
        `Error fetching dara from Green Metrics API. ${JSON.stringify(
          errorMessage
        )}`
      );
    }
  };

  return {
    getRepoMetrics,
  };
};
