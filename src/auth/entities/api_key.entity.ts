import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

export class ApiKey extends CustomTypeormEntityBase {
    static tableName = 'api_key';
    api_key_id = CustomTypeormFields.AutoPK({ db_column: 'api_key_id' });
    prefix = CustomTypeormFields.CharacterString({
        db_column: 'prefix',
        null: false,
        blank: false,
        max_length: 32,
        unique: true,
    });
    token_hash = CustomTypeormFields.CharacterString({
        db_column: 'token_hash',
        null: false,
        blank: false,
        max_length: 64,
        unique: true,
    });
    name = CustomTypeormFields.CharacterString({
        db_column: 'name',
        null: true,
        blank: true,
        max_length: 200,
    });
    created_at = CustomTypeormFields.CharacterString({
        db_column: 'created_at',
        null: false,
        blank: false,
        max_length: 64,
    });
    revoked_at = CustomTypeormFields.CharacterString({
        db_column: 'revoked_at',
        null: true,
        blank: true,
        max_length: 64,
    });
    user_id = CustomTypeormFields.FK({
        model_name: 'user',
        db_column: 'user_id',
        on_delete: 'CASCADE',
        null: false,
    });
}
