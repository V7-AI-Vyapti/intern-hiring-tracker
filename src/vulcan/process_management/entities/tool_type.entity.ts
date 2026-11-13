import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class ToolType extends CustomTypeormEntityBase {
    static tableName = 'tool_type';
    tool_type_id = CustomTypeormFields.AutoPK({ db_column: 'tool_type_id' });
    tool_type_name = CustomTypeormFields.CharacterString({
        db_column: 'tool_type_name',
        null: false,
        blank: false,
        max_length: 255,
    });
    description = CustomTypeormFields.Text({
        db_column: 'description',
        null: true,
        blank: true,
    });
    is_available = CustomTypeormFields.Boolean({
        db_column: 'is_available',
        null: true,
        blank: true,
        default: false,
    });
}
