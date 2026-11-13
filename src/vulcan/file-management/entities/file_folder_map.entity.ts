import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class FileFolderMap extends CustomTypeormEntityBase {
    static tableName = 'file_folder_map';
    file_folder_map_id = CustomTypeormFields.AutoPK({ db_column: 'file_folder_map_id' });
    file_folder_map_name = CustomTypeormFields.CharacterString({ db_column: 'file_folder_map_name', null: false, blank: false, max_length: 255 });
    description = CustomTypeormFields.Text({ db_column: 'description', null: true, blank: true });
    file_id = CustomTypeormFields.FK({ model_name: 'file', db_column: 'file_id' });
    folder_id = CustomTypeormFields.FK({ model_name: 'folder', db_column: 'folder_id' });
}
