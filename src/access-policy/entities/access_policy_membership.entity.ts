import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

class AccessPolicyMembership extends CustomTypeormEntityBase {
    static tableName = 'access_policy_membership';
    static uniques = [['user_id', 'scope_key', 'scope_id']];
    access_policy_membership_id = CustomTypeormFields.AutoPK({
        db_column: 'access_policy_membership_id',
    });
    user_id = CustomTypeormFields.CharacterString({
        db_column: 'user_id',
        null: false,
        blank: false,
        max_length: 100,
    });
    scope_key = CustomTypeormFields.CharacterString({
        db_column: 'scope_key',
        null: false,
        blank: false,
        max_length: 200,
    });
    scope_id = CustomTypeormFields.CharacterString({
        db_column: 'scope_id',
        null: false,
        blank: false,
        max_length: 200,
    });
}

export { AccessPolicyMembership };
