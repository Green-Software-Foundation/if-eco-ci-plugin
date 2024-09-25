import axios from 'axios';
import moment from 'moment-timezone';

import { ERRORS } from '@grnsft/if-core/utils';

import { EcoCiParams } from './types';

const { APIRequestError } = ERRORS;

export const EcoCiAPI = () => {
  const greenCodingAPI = axios.create({
    baseURL: 'https://api.green-coding.io/v1/ci/',
  });

  greenCodingAPI?.interceptors?.response?.use(
    (response) => {
      // In case of status 204, the API returns `statusText: No Content` and the `data: undefined`
      if (response.status == 204) {
        return [];
      }

      if (!response?.data?.success) {
        throw new Error(
          `Error fetching data from Green Coding API. ${
            response?.data?.data.statusText || response?.statusText
          }`
        );
      }

      return response.data.data;
    },
    (error) => {
      const errorMessage = error?.response?.data?.err[0]?.msg;
      if (error.response) {
        throw new APIRequestError(
          `Error fetching data from Green Coding API. ${JSON.stringify(
            errorMessage
          )}`
        );
      } else if (error.request) {
        throw new APIRequestError(
          `No response received from Green Coding API. ${error.message}`
        );
      } else {
        throw new APIRequestError(`Request error: ${error.message}`);
      }
    }
  );

  /**
   * Gets data for all branches for a given time range.
   */
  const getAllBranchesDataForTimeRange = async (params: EcoCiParams) => {
    const result = await greenCodingAPI.get<string, any>('runs', {
      params: {
        repo: params.repo,
        sort_by: 'date',
      },
    });

    const responsesData = [];

    for (const branch of result) {
      const brachDateInMilliseconds = moment
        .tz(branch[4].toString(), 'UTC')
        .toDate()
        .getTime();
      const startDateInMilliseonds = moment.utc(params['start_date']).valueOf();
      const endDateInMilliseonds = moment.utc(params['end_date']).valueOf();

      if (
        brachDateInMilliseconds >= startDateInMilliseonds &&
        brachDateInMilliseconds <= endDateInMilliseonds
      ) {
        const updatedParams = {
          ...params,
          branch: branch[1],
        };
        const response = await getData(updatedParams);
        responsesData.push(...response);
      }
    }

    return responsesData || [];
  };

  /**
   * Gets data for a branch for a given time range.
   */
  const getData = async (params: EcoCiParams) => {
    const result = await greenCodingAPI.get<string, any>('measurements', {
      params: {
        ...params,
        start_date:
          params.start_date?.toString().split('T')[0] || params.start_date,
        end_date: params.end_date?.toString().split('T')[0] || params.end_date,
      },
    });

    return result || [];
  };

  /**
   * Gets energy and carbon of the specified repo workflow.
   */
  const getRepoMetrics = async (params: EcoCiParams) => {
    let result: any = {};
    if (params.branch.trim() === 'all') {
      result = await getAllBranchesDataForTimeRange(params);
    } else {
      result = await getData(params);
    }

    return result;
  };

  return {
    getRepoMetrics,
  };
};
