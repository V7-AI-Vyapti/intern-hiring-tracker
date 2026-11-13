import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

class Permission extends CustomTypeormEntityBase {
    static tableName = 'permission';
    static uniques = [['role_id', 'entity_name', 'operation']];
    permission_id = CustomTypeormFields.AutoPK({ db_column: 'permission_id' });
    entity_name = CustomTypeormFields.CharacterString({
        db_column: 'entity_name',
        null: false,
        blank: false,
        max_length: 200,
    });
    operation = CustomTypeormFields.CharacterString({
        db_column: 'operation',
        null: false,
        blank: false,
        max_length: 100,
    });
    role_id = CustomTypeormFields.FK({
        model_name: 'role',
        db_column: 'role_id',
        on_delete: 'CASCADE',
        null: false,
    });
}

export { Permission };
