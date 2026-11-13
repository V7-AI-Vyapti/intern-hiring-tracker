import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class JobOpening extends CustomTypeormEntityBase {
    static tableName = 'job_opening';
    title = CustomTypeormFields.CharacterString({ db_column: 'title' });
    team = CustomTypeormFields.CharacterString({ db_column: 'team' });
    status = CustomTypeormFields.CharacterString({ db_column: 'status' });
    job_opening_id = CustomTypeormFields.AutoPK({
        db_column: 'job_opening_id',
    });
    opening_id = CustomTypeormFields.CharacterString({
        db_column: 'opening_id',
    });
    location = CustomTypeormFields.CharacterString({ db_column: 'location' });
    stipend_inr = CustomTypeormFields.Integer({ db_column: 'stipend_inr' });
    positions = CustomTypeormFields.Integer({ db_column: 'positions' });
    posted_on = CustomTypeormFields.CharacterString({ db_column: 'posted_on' });
    closes_on = CustomTypeormFields.CharacterString({ db_column: 'closes_on' });
    interview_rounds = CustomTypeormFields.Integer({
        db_column: 'interview_rounds',
    });
    assessment_name = CustomTypeormFields.CharacterString({
        db_column: 'assessment_name',
    });
    assessment_days = CustomTypeormFields.Integer({
        db_column: 'assessment_days',
    });
    owner = CustomTypeormFields.FK({
        model_name: 'team_member',
        db_column: 'member_id',
    });
}
