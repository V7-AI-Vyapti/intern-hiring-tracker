import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class Folder extends CustomTypeormEntityBase {
    static tableName = 'folder';
    folder_id = CustomTypeormFields.AutoPK({ db_column: 'folder_id' });
    folder_name = CustomTypeormFields.CharacterString({ db_column: 'folder_name', null: false, blank: false, max_length: 255 });
    description = CustomTypeormFields.Text({ db_column: 'description', null: true, blank: true });
    created_at = CustomTypeormFields.Integer({ db_column: 'created_at' });
    updated_at = CustomTypeormFields.Integer({ db_column: 'updated_at' });
    parent_folder_id = CustomTypeormFields.FK({ model_name: 'folder', db_column: 'parent_folder_id' });
}
