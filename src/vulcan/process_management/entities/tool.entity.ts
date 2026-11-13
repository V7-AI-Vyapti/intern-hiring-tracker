import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class Tool extends CustomTypeormEntityBase {
    static tableName = 'tool';
    tool_id = CustomTypeormFields.AutoPK({ db_column: 'tool_id' });
    tool_name = CustomTypeormFields.CharacterString({ db_column: 'tool_name', null: false, blank: false, max_length: 255 });
    description = CustomTypeormFields.Text({ db_column: 'description', null: true, blank: true });
    additional_json_data = CustomTypeormFields.JSON({ db_column: 'additional_json_data' });
    tool_type_id = CustomTypeormFields.FK({ model_name: 'tool_type', db_column: 'tool_type_id' });
}
