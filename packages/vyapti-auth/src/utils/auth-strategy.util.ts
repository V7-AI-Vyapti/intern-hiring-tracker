import { AUTH_STRATEGIES } from '../auth.constants.js';
import type { AuthStrategy } from '../types/auth.types.js';

function hasAuthStrategy(args: {
    strategies: readonly AuthStrategy[];
    strategy: AuthStrategy;
}): boolean {
    return args.strategies.includes(args.strategy);
}

function hasJwtStrategy(strategies: readonly AuthStrategy[]): boolean {
    return hasAuthStrategy({
        strategies,
        strategy: AUTH_STRATEGIES.JWT,
    });
}

function hasApiKeyStrategy(strategies: readonly AuthStrategy[]): boolean {
    return hasAuthStrategy({
        strategies,
        strategy: AUTH_STRATEGIES.API_KEY,
    });
}

export { hasApiKeyStrategy, hasAuthStrategy, hasJwtStrategy };
