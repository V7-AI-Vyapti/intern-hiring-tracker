import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

export class Entity extends CustomTypeormEntityBase {
    static tableName = 'entity';
    entity_id = CustomTypeormFields.AutoPK({ db_column: 'entity_id' });
    entity_name = CustomTypeormFields.CharacterString({
        db_column: 'entity_name',
        null: false,
        blank: false,
        max_length: 255,
    });
    description = CustomTypeormFields.Text({ db_column: 'description' });
    fields = CustomTypeormFields.JSON({ db_column: 'fields' });
}
