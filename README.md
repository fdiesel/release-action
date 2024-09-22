# Release - GitHub Action

Creates a new release based on conventional commits.

Reverts the release in the post job in case a step has failed.

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
        uses: fdiesel/release-action@v
        with:
          token: ${{ secrets.GITHUB_TOKEN }} # required
          phase: prod # phase (dev -> 0.y.z / prod -> x>0.y.z) (default: dev)
```

### Outputs

| key          | value                                                           |
| :----------- | :-------------------------------------------------------------- |
| created      | 'true' if a release was created                                 |
| preRelease   | 'alpha' / 'beta' / 'rc' if the created release is a pre-release |
| tag          | tag name                                                        |
| majorTag     | major version tag name                                          |
| version      | semantic version                                                |
| majorVersion | major version                                                   |
