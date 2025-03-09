# Conversion Script Tests

This directory contains tests for the Docusaurus to Nextra conversion script.

## Running the Tests

To run the tests, execute the following commands from the `scripts` directory:

```bash
npm install  # Install dependencies (only needed once)
npm test     # Run the tests
```

## Test Structure

The tests use a temporary directory structure created in `__tests__/test-data/` with:

-   `docs-old/`: Mock Docusaurus docs structure
-   `docs-new/`: Output Nextra docs structure

Test fixtures are stored in the `fixtures/` directory and are copied to the test directories during test execution.

Each test creates sample files in the mock structure, runs the conversion, and then verifies the output.

## Adding New Tests

To add new tests:

1. Add a new test case in `convert.test.ts`
2. Create sample files that represent the scenario you want to test
3. Run the conversion
4. Verify the output matches the expected result
