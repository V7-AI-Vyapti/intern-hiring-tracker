import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class FileMetaData extends CustomTypeormEntityBase {
    static tableName = 'file_meta_data';
    file_meta_data_id = CustomTypeormFields.AutoPK({ db_column: 'file_meta_data_id' });
    file_meta_data_name = CustomTypeormFields.CharacterString({ db_column: 'file_meta_data_name', null: false, blank: false, max_length: 255 });
    description = CustomTypeormFields.Text({ db_column: 'description', null: true, blank: true });
    mime_type = CustomTypeormFields.CharacterString({ db_column: 'mime_type', max_length: 120 });
    file_size_bytes = CustomTypeormFields.Integer({ db_column: 'file_size_bytes' });
    bucket_name = CustomTypeormFields.CharacterString({ db_column: 'bucket_name' });
    storage_path = CustomTypeormFields.Text({ db_column: 'storage_path' });
    created_at = CustomTypeormFields.Integer({ db_column: 'created_at' });
    updated_at = CustomTypeormFields.Integer({ db_column: 'updated_at' });
    file_id = CustomTypeormFields.FK({ model_name: 'file', db_column: 'file_id' });
}
