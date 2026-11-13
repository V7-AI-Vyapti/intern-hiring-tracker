import { AUTH_MESSAGES } from '../auth.constants.js';

function loadJwtKeys(args: {
    privateKeyEnv: string;
    publicKeyEnv: string;
}): { privateKey: string; publicKey: string } {
    const privateKey = process.env[args.privateKeyEnv];
    const publicKey = process.env[args.publicKeyEnv];

    if (!privateKey?.trim() || !publicKey?.trim()) {
        throw new Error(
            `${AUTH_MESSAGES.JWT_KEYS_MISSING}: set ${args.privateKeyEnv} and ${args.publicKeyEnv}`,
        );
    }

    return { privateKey, publicKey };
}

export { loadJwtKeys };
