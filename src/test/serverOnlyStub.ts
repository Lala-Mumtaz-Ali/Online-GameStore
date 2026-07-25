// Every module in src/data/ starts with `import "server-only"`, which throws
// outside a React Server Component render. vitest.config.ts aliases that package
// to this empty module so the data layer can be imported in a plain Node test.
export {};
