function normalizePemEnv(envName: string): void {
    const value = process.env[envName];
    if (!value) {
        return;
    }

    process.env[envName] = value.replace(/\\n/g, '\n');
}

export { normalizePemEnv };
