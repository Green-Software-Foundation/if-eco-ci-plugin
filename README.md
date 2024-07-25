# README

## Overview

The EcoCI plugin retrieves the `energy` and the `carbon` of the workflow of the a given repository using the [Green Metrics](https://metrics.green-coding.io/index.html) API, if the workflow of the repository is listed in the [CI projects](https://metrics.green-coding.io/ci-index.html).

## Implementation

The EcoCI plugin fetches the `energy` and `carbon` of the specified workflow from the Green Metrics API for each entry in a manifest's input data.

- The `timestamp` and `duration` fields in the input data are used to filter the `energy` and `carbon` data. The relevant endpoint is documented [here](https://api.green-coding.io/docs).
- The Green Metrics API provides data if the `timestamp` have zero time – e.g., is exact date.

## Usage

To run the `EcoCI` plugin, an instance of `ExecutePlugin` must be created. Then, the plugin's `execute()` method can be called, passing required arguments to it.

This is how you could run the model in Typescript:

```typescript
async function runPlugin() {
  const config = {
    repo: 'Green-Software-Foundation/if',
    branch: 'main',
    workflow: 66389738,
  };
  const ecoCi = await new EcoCI(config);
  const usage = await ecoCi.execute([
    {
      timestamp: '2024-07-09T00:00',
      duration: 126000,
    },
  ]);

  console.log(usage);
}

runPlugin();
```

## Global Config

- `repo`: (required) string specifies the name of the organization (or owner) and repository name, combined with `/`, e.g. `Green-Software-Foundation/if`
- `branch`: (required) string specifies the branch of the repository
- `workflow`: (required) number specifies the workflow id of the repository

## Input Parameters

- `timestamp`: (required) specifies the start of the time range for retrieving data from the EcoCI API. Note that the EcoCI API provides data if the date have zero time – e.g., is exact dates.
- `duration`: (required) specifies the end of the time range for retrieving data from the API. It can be either number or string like `24 * 60 * 60 * 1000`.

## Output

- `energy`: output the size of the given repository, represented in `GB`.
- `carbon`: output the clones count of the given repository in the specified time range.

## Error Handling

The plugin can throw the following errors:

- `APIRequestError`: caused by a problem retrieving data from the API. The error message returned from the API is echoed in the IF error message.
- `InputValidationError`: thrown when some data in the input is incorrect or missing.
- `GlobalConfigError`: thrown when some data in the global config is incorrect or missing.

## Integration into Impact Framework

You can load the plugin directly from this EcoCI repository. Simply run `npm install -g https://github.com/Green-Software-Foundation/if-eco-ci-plugin`

Then, in your `manifest`, provide the path in the model instantiation. You also need to specify the function name for the exported plugin function.

```yaml
name: eco-ci demo
description:
tags:
initialize:
  plugins:
    ci/cd:
      method: EcoCI
      path: 'if-eco-ci-plugin'
      global-config:
        repo: 'Green-Software-Foundation/if'
        branch: main
        workflow: 66389738
tree:
  children:
    child:
      pipeline:
        - ci/cd
      config:
      inputs:
        - timestamp: 2024-07-09T00:00
          duration: 24 * 60 * 60 * 100
```

Now, when you run the `manifest` using the IF CLI, it will load the model automatically. Run using:

```sh
if-run -m <path-to-your-manifest>
```

## References

The plugin simply grabs data for a given repository from the [Green Metrics API](metrics.green-coding.io).

- To calculate `energy` and `carbon`, the plugin uses [this](https://api.green-coding.io/docs#/default/get_ci_measurements_v1_ci_measurements_get) endpoint.
