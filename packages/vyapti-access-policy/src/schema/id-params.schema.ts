import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const PolicyIdParamsSchema = z.object({
    policyId: z.string().trim().min(1),
});

const MembershipIdParamsSchema = z.object({
    membershipId: z.string().trim().min(1),
});

class PolicyIdParamsDto extends createZodDto(PolicyIdParamsSchema) {}
class MembershipIdParamsDto extends createZodDto(MembershipIdParamsSchema) {}

export { MembershipIdParamsDto, PolicyIdParamsDto };
