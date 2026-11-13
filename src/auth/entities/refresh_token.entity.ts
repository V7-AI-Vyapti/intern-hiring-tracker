import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';

export class RefreshToken extends CustomTypeormEntityBase {
    static tableName = 'refresh_token';
    refresh_token_id = CustomTypeormFields.AutoPK({
        db_column: 'refresh_token_id',
    });
    token_hash = CustomTypeormFields.CharacterString({
        db_column: 'token_hash',
        null: false,
        blank: false,
        max_length: 64,
        unique: true,
    });
    expires_at = CustomTypeormFields.CharacterString({
        db_column: 'expires_at',
        null: false,
        blank: false,
        max_length: 64,
    });
    user_id = CustomTypeormFields.FK({
        model_name: 'user',
        db_column: 'user_id',
        on_delete: 'CASCADE',
        null: false,
    });
}
