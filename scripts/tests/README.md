# Testing the Conversion Script

This directory contains tests for the conversion script that transforms Docusaurus docs to Nextra format.

## Running the Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode (useful during development):

```bash
npm run test:watch
```

## Test Coverage

The tests are set up to generate coverage reports. After running the tests, you can view the coverage report in the `coverage` directory.

## Test Structure

The tests are organized by function:

-   `removeInfoBlocks.test.ts`: Tests for the function that removes info blocks from content
-   `createMetaFile.test.ts`: Tests for the function that creates \_meta.js files
-   `processMdxFile.test.ts`: Tests for the function that processes individual MDX files
-   `processDirectory.test.ts`: Tests for the function that processes directories recursively
-   `main.test.ts`: Tests for the main function that orchestrates the conversion process

## Mocking

The tests use Jest's mocking capabilities to mock file system operations and other dependencies, allowing us to test the functions in isolation without actually reading from or writing to the file system.
