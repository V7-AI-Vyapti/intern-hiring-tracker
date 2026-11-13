import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

class RbacCatalog extends CustomTypeormEntityBase {
    static tableName = 'rbac_catalog';
    static uniques = [['resource']];
    rbac_catalog_id = CustomTypeormFields.AutoPK({
        db_column: 'rbac_catalog_id',
    });
    resource = CustomTypeormFields.CharacterString({
        db_column: 'resource',
        null: false,
        blank: false,
        max_length: 200,
    });
    actions = CustomTypeormFields.JSON({
        db_column: 'actions',
        null: false,
        blank: false,
    });
}

export { RbacCatalog };
