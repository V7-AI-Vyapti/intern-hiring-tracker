import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

export class AvailableTool extends CustomTypeormEntityBase {
    static tableName = 'available_tool';
    available_tool_id = CustomTypeormFields.AutoPK({
        db_column: 'available_tool_id',
    });
    configured_tool_name = CustomTypeormFields.CharacterString({
        db_column: 'configured_tool_name',
        null: false,
        blank: false,
        max_length: 255,
    });
    description = CustomTypeormFields.Text({ db_column: 'description' });
    tool_type_name = CustomTypeormFields.CharacterString({
        db_column: 'tool_type_name',
        null: false,
        blank: false,
        max_length: 255,
    });
    api_endpoint = CustomTypeormFields.JSON({ db_column: 'api_endpoint' });
    target_entity_name = CustomTypeormFields.CharacterString({
        db_column: 'target_entity_name',
        max_length: 255,
    });
    additional_json_data = CustomTypeormFields.JSON({
        db_column: 'additional_json_data',
    });
}
