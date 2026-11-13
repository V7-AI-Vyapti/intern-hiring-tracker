import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

class RbacBundle extends CustomTypeormEntityBase {
    static tableName = 'rbac_bundle';
    static uniques = [['name']];
    rbac_bundle_id = CustomTypeormFields.AutoPK({
        db_column: 'rbac_bundle_id',
    });
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
}

export { RbacBundle };
