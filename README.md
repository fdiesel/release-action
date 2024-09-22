# Release - GitHub Action

Creates a new release based on conventional commits.

The new release will be drafted during the main job and released during the post job.

This ensures all commits created during the workflow are part of the release.

## Usage

```yml
name: Release

on:
  push:
    branches: main

jobs:
  release:
    runs-on: ubuntu-latest

    permissions:
      contents: write

    steps:
      - name: Checkout Main
        uses: actions/checkout@v4

      - name: Release
        uses: fdiesel/release-action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }} # required
          prefix: v # optional tag prefix (default: v)
          strategy: node # optional (default: '')
          first: 0.1.0 # optional first version (default: 0.1.0)
```

### Strategies

If no strategy is set, the workflow will only use git and not update any files.

| value | task                                                                                           |
| :---- | :--------------------------------------------------------------------------------------------- |
| node  | utilizes `npm version ...` to bump the version in the package.json and package-lock.json files |

### Outputs

| key         | value                                          |
| :---------- | :--------------------------------------------- |
| created     | 'true' if a release was created                |
| pre-release | 'true' if the created release is a pre-release |
| tag         | tag name                                       |
| version     | semantic version                               |
