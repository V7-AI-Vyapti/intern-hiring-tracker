import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class FileFormat extends CustomTypeormEntityBase {
    static tableName = 'file_format';
    file_format_id = CustomTypeormFields.AutoPK({ db_column: 'file_format_id' });
    file_format_name = CustomTypeormFields.CharacterString({ db_column: 'file_format_name', null: false, blank: false, max_length: 255 });
    description = CustomTypeormFields.Text({ db_column: 'description', null: true, blank: true });
}
