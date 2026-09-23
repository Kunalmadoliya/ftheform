# @repo/eslint-config

Shared ESLint configuration used by the monorepo packages and apps. It provides presets for base TypeScript code, Next.js applications, and React-internal packages.

Each consuming package extends the appropriate local preset from its ESLint configuration. Keep application-specific rules in the app instead of changing the shared preset for a one-off case.

This package is internal and is not deployed independently. Changes here affect linting across the workspace, so run the relevant package lint command after modifying a preset.
