import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

class RbacRoleBundle extends CustomTypeormEntityBase {
    static tableName = 'rbac_role_bundle';
    static uniques = [['role_id', 'bundle_id']];
    rbac_role_bundle_id = CustomTypeormFields.AutoPK({
        db_column: 'rbac_role_bundle_id',
    });
    role_id = CustomTypeormFields.FK({
        model_name: 'role',
        db_column: 'role_id',
        on_delete: 'CASCADE',
        null: false,
    });
    bundle_id = CustomTypeormFields.FK({
        model_name: 'rbac_bundle',
        db_column: 'bundle_id',
        on_delete: 'CASCADE',
        null: false,
    });
}

export { RbacRoleBundle };
