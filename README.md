# Impact Framework Eco CI Plugin

## Overview

The EcoCI plugin retrieves the `energy` and the `carbon` of the workflow of the given repository using the [Green Coding](https://metrics.green-coding.io/index.html) API, if the workflow of the repository is listed in the [CI projects](https://metrics.green-coding.io/ci-index.html).

## Implementation

The EcoCI plugin fetches the `energy` and `carbon` of the specified workflow from the Green Coding API for each entry in a manifest's input data.

- The `timestamp` and `duration` fields in the input data are used to filter the `energy` and `carbon` data. The relevant endpoint is documented [here](https://api.green-coding.io/docs).

## Usage

To run the `EcoCI` plugin, an instance of `ExecutePlugin` must be created. Then, the plugin's `execute()` method can be called, passing the required arguments to it.

This is how you could run the model in Typescript:

```typescript
async function runPlugin() {
  const config = {
    repo: 'Green-Software-Foundation/if',
    branch: 'main',
    workflow: 66389738,
  };
  const parameterMetadata = { inputs: {}, output: {} };
  const ecoCi = EcoCI(config, parameterMetadata, {});
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

## Config

- `repo`: (required) string specifies the name of the organization (or owner) and repository name, combined with `/`, e.g. `Green-Software-Foundation/if`
- `branch`: (required) string specifies the branch of the repository. You can also use the `all` option to retrieve data for all branches within the specified time range
- `workflow`: (required) number specifies the workflow id of the repository
- `start-date`: (optional) string specifies the start of the time range for retrieving data. If not provided, the plugin defaults to using a `timestamp` from the input.
- `end-date`: (optional) string specifies the end of the time range. If not provided, the plugin defaults to using the `duration` from the input.

## Input Parameters

- `timestamp`: (required) specifies the start of the time range for retrieving data from the EcoCI API.
- `duration`: (required) specifies the end of the time range for retrieving data from the API. It can be either number or string like `24 * 60 * 60`.

## Mapping

The `mapping` block is an optional block. It is added in the plugin section and allows the plugin to map the output parameters of the plugin. The structure of the `mapping` block is:

```yaml
eco-ci-plugin:
  path: if-eco-ci-plugin
  method: EcoCI
  mapping:
    energy: 'energy-used-in-if-all'
    carbon: 'carbon-used-in-if-all'
```

## Output

- `energy`: output the size of the given repository, represented in `GB`.
- `carbon`: output the clones count of the given repository in the specified time range.

## Error Handling

The plugin can throw the following errors:

- `APIRequestError`: caused by a problem retrieving data from the API. The error message returned from the API is echoed in the IF error message.
- `InputValidationError`: thrown when some data in the input is incorrect or missing.
- `ConfigError`: thrown when some data in the global config is incorrect or missing.

## Integration into Impact Framework

Clone this repository to your local machine to play with a local copy. In the project root run `npm run build && npm link`.

This creates a package with global scope on your local machine that can be installed by your instance of Impact Framework.

Navigate to the Impact Framework root, and run `npm link if-eco-ci-plugin`.

Now, you can use the plugin by including it in your manifest file as follows:

```yaml
name: eco-ci demo
description:
tags:
initialize:
  plugins:
    ci/cd:
      method: EcoCI
      path: 'if-eco-ci-plugin'
      config:
        repo: 'Green-Software-Foundation/if'
        branch: all
        workflow: 66389738
        start-date: 2024-07-24T10:30
        end-date: 2024-08-14T10:30
      mapping:
        energy: 'energy-used-in-if-all'
        carbon: 'carbon-used-in-if-all'
tree:
  children:
    child:
      pipeline:
        compute:
          - ci/cd
      inputs:
        - timestamp: 2024-07-09T00:00
          duration: 24 * 60 * 60
```

Now, when you run the `manifest` using the IF CLI, it will load the model automatically. Run using:

```sh
if-run -m <path-to-your-manifest>
```

## References

The plugin simply grabs data for a given repository from the [Green Coding API](metrics.green-coding.io).

- To calculate `energy` and `carbon`, the plugin uses [this](https://api.green-coding.io/docs#/default/get_ci_measurements_v1_ci_measurements_get) endpoint.
