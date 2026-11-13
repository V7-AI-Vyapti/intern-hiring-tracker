import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class File extends CustomTypeormEntityBase {
    static tableName = 'file';
    file_id = CustomTypeormFields.AutoPK({ db_column: 'file_id' });
    file_name = CustomTypeormFields.CharacterString({ db_column: 'file_name', null: false, blank: false, max_length: 255 });
    description = CustomTypeormFields.Text({ db_column: 'description', null: true, blank: true });
    file_url = CustomTypeormFields.Text({ db_column: 'file_url' });
}
