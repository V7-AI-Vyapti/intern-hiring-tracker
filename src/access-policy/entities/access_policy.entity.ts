import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

class AccessPolicy extends CustomTypeormEntityBase {
    static tableName = 'access_policy';
    static uniques = [['entity_name']];
    access_policy_id = CustomTypeormFields.AutoPK({
        db_column: 'access_policy_id',
    });
    entity_name = CustomTypeormFields.CharacterString({
        db_column: 'entity_name',
        null: false,
        blank: false,
        max_length: 200,
    });
    mode = CustomTypeormFields.CharacterString({
        db_column: 'mode',
        null: false,
        blank: false,
        max_length: 20,
    });
    constraint_field = CustomTypeormFields.CharacterString({
        db_column: 'constraint_field',
        null: true,
        blank: true,
        max_length: 200,
    });
    scope_key = CustomTypeormFields.CharacterString({
        db_column: 'scope_key',
        null: true,
        blank: true,
        max_length: 200,
    });
}

export { AccessPolicy };
