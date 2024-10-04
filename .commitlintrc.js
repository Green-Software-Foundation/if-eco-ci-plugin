module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'chore',
        'style',
        'refactor',
        'ci',
        'test',
        'revert',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'util',
        'lib',
        'types',
        'src',
        'package',
        'config',
        'mocks',
        '.github',
        '.husky',
        'scripts',
        'builtins',
        'plugins',
        'integration',
        'doc',
        'manifests',
        'release',
        '.commitlint'
      ],
    ],
    'scope-empty': [2, 'never'],
  },
};
