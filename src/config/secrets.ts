/**
 * Read a required env var. Throws if missing so we never fall back to
 * hard-coded secrets in JWT/session configuration.
 */
export const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} environment variable is required`);
    }
    return value;
};
