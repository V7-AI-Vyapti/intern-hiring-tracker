import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
    AUTH_PERSISTENCE_ADAPTER,
    PasswordService,
    type AuthPersistenceAdapter,
} from '@vyapti/auth';
import { GENERATED_AUTH_CONFIG } from '../auth.config';
import { GENERATED_AUTH_MESSAGES } from '../auth.constants';

@Injectable()
class GeneratedAuthBootstrapService implements OnModuleInit {
    private readonly logger = new Logger(GeneratedAuthBootstrapService.name);

    constructor(
        @Inject(AUTH_PERSISTENCE_ADAPTER)
        private readonly persistence: AuthPersistenceAdapter,
        private readonly passwordService: PasswordService,
    ) {}

    async onModuleInit(): Promise<void> {
        const email = process.env[GENERATED_AUTH_CONFIG.BOOTSTRAP_EMAIL_ENV]
            ?.trim()
            .toLowerCase();
        const password =
            process.env[GENERATED_AUTH_CONFIG.BOOTSTRAP_PASSWORD_ENV];

        if (!email || !password) {
            this.logger.warn(GENERATED_AUTH_MESSAGES.BOOTSTRAP_SKIPPED_MISSING_ENV);
            return;
        }

        const existing = await this.persistence.findUserByEmail({ email });
        if (existing) {
            this.logger.log(GENERATED_AUTH_MESSAGES.BOOTSTRAP_SKIPPED_EXISTS);
            return;
        }

        const passwordHash = await this.passwordService.hashPassword({
            password,
        });
        await this.persistence.createUser({
            email,
            passwordHash,
            displayName: GENERATED_AUTH_CONFIG.BOOTSTRAP_DISPLAY_NAME,
        });
        this.logger.log(GENERATED_AUTH_MESSAGES.BOOTSTRAP_SEEDED);
    }
}

export { GeneratedAuthBootstrapService };
