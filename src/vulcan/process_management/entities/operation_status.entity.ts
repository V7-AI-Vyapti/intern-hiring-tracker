import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class OperationStatus extends CustomTypeormEntityBase {
    static tableName = 'operation_status';
    operation_status_id = CustomTypeormFields.AutoPK({ db_column: 'operation_status_id' });
    operation_status_name = CustomTypeormFields.CharacterString({ db_column: 'operation_status_name', null: false, blank: false, max_length: 255 });
    description = CustomTypeormFields.Text({ db_column: 'description', null: true, blank: true });
}
