// Load variables from .env into process.env (built into Node, no package needed).
// Values already set in the environment win, so tests and deployments can override them.
try {
  process.loadEnvFile();
} catch {
  // No .env file: fall back to real environment variables and the defaults
}
