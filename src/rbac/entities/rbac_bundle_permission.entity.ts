import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

class RbacBundlePermission extends CustomTypeormEntityBase {
    static tableName = 'rbac_bundle_permission';
    static uniques = [['bundle_id', 'entity_name', 'operation']];
    rbac_bundle_permission_id = CustomTypeormFields.AutoPK({
        db_column: 'rbac_bundle_permission_id',
    });
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
    bundle_id = CustomTypeormFields.FK({
        model_name: 'rbac_bundle',
        db_column: 'bundle_id',
        on_delete: 'CASCADE',
        null: false,
    });
}

export { RbacBundlePermission };
