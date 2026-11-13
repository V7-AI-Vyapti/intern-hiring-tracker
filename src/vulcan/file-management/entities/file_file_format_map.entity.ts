import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class FileFileFormatMap extends CustomTypeormEntityBase {
    static tableName = 'file_file_format_map';
    file_file_format_map_id = CustomTypeormFields.AutoPK({ db_column: 'file_file_format_map_id' });
    file_file_format_map_name = CustomTypeormFields.CharacterString({ db_column: 'file_file_format_map_name', null: false, blank: false, max_length: 255 });
    description = CustomTypeormFields.Text({ db_column: 'description', null: true, blank: true });
    file_id = CustomTypeormFields.FK({ model_name: 'file', db_column: 'file_id', on_delete: 'RESTRICT', null: false });
    file_format_id = CustomTypeormFields.FK({ model_name: 'file_format', db_column: 'file_format_id', on_delete: 'RESTRICT', null: false });
}
