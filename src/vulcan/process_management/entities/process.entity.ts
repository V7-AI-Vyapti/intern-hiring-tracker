import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class Process extends CustomTypeormEntityBase {
    static tableName = 'process';
    process_id = CustomTypeormFields.AutoPK({ db_column: 'process_id' });
    process_name = CustomTypeormFields.CharacterString({ db_column: 'process_name', null: false, blank: false, max_length: 255 });
    description = CustomTypeormFields.Text({ db_column: 'description', null: true, blank: true });
    process_metadata = CustomTypeormFields.JSON({ db_column: 'process_metadata' });
    process_result_json = CustomTypeormFields.JSON({ db_column: 'process_result_json' });
    process_error_json = CustomTypeormFields.JSON({ db_column: 'process_error_json' });
    tool_id = CustomTypeormFields.FK({ model_name: 'tool', db_column: 'tool_id', on_delete: 'RESTRICT', null: false });
    process_status_id = CustomTypeormFields.FK({ model_name: 'operation_status', db_column: 'process_status_id', on_delete: 'RESTRICT', null: false });
}
