import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class JobCandidate extends CustomTypeormEntityBase {
    static tableName = 'job_candidate';
    name = CustomTypeormFields.CharacterString({ db_column: 'name' });
    email = CustomTypeormFields.CharacterString({ db_column: 'email' });
    job_candidate_id = CustomTypeormFields.AutoPK({
        db_column: 'job_candidate_id',
    });
    candidate_id = CustomTypeormFields.CharacterString({
        db_column: 'candidate_id',
    });
    opening = CustomTypeormFields.FK({
        model_name: 'job_opening',
        db_column: 'opening_id',
    });
    college = CustomTypeormFields.CharacterString({ db_column: 'college' });
    degree = CustomTypeormFields.CharacterString({ db_column: 'degree' });
    graduation_year = CustomTypeormFields.Integer({
        db_column: 'graduation_year',
    });
    source = CustomTypeormFields.CharacterString({ db_column: 'source' });
    resume_link = CustomTypeormFields.CharacterString({
        db_column: 'resume_link',
    });
    applied_on = CustomTypeormFields.CharacterString({
        db_column: 'applied_on',
    });
    stage = CustomTypeormFields.CharacterString({ db_column: 'stage' });
    stage_updated_on = CustomTypeormFields.CharacterString({
        db_column: 'stage_updated_on',
    });
    rejected_reason = CustomTypeormFields.Text({
        db_column: 'rejected_reason',
    });
    joining_on = CustomTypeormFields.CharacterString({
        db_column: 'joining_on',
    });
    notes = CustomTypeormFields.Text({ db_column: 'notes' });
}
