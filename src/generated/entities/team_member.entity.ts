import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class TeamMember extends CustomTypeormEntityBase {
    static tableName = 'team_member';
    team_member_id = CustomTypeormFields.AutoPK({
        db_column: 'team_member_id',
    });
    status = CustomTypeormFields.CharacterString({ db_column: 'status' });
    team = CustomTypeormFields.CharacterString({ db_column: 'team' });
    role = CustomTypeormFields.CharacterString({ db_column: 'role' });
    email = CustomTypeormFields.CharacterString({ db_column: 'email' });
    member_id = CustomTypeormFields.CharacterString({ db_column: 'member_id' });
    name = CustomTypeormFields.CharacterString({ db_column: 'name' });
}
