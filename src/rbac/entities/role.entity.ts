import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

class Role extends CustomTypeormEntityBase {
    static tableName = 'role';
    static uniques = [['name']];
    role_id = CustomTypeormFields.AutoPK({ db_column: 'role_id' });
    name = CustomTypeormFields.CharacterString({
        db_column: 'name',
        null: false,
        blank: false,
        max_length: 100,
    });
    label = CustomTypeormFields.CharacterString({
        db_column: 'label',
        null: false,
        blank: false,
        max_length: 200,
    });
    hint = CustomTypeormFields.CharacterString({
        db_column: 'hint',
        null: true,
        blank: true,
        max_length: 500,
    });
    is_system = CustomTypeormFields.Boolean({
        db_column: 'is_system',
        null: false,
        blank: false,
        default: false,
    });
    full_access = CustomTypeormFields.Boolean({
        db_column: 'full_access',
        null: false,
        blank: false,
        default: false,
    });
}

export { Role };
