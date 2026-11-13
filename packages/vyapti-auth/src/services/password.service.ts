import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AUTH_PASSWORD } from '../auth.constants.js';

@Injectable()
class PasswordService {
    async hashPassword(args: { password: string }): Promise<string> {
        return bcrypt.hash(args.password, AUTH_PASSWORD.BCRYPT_ROUNDS);
    }

    async passwordMatches(args: {
        password: string;
        passwordHash: string;
    }): Promise<boolean> {
        return bcrypt.compare(args.password, args.passwordHash);
    }
}

export { PasswordService };
