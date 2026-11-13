import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class JobAssessment extends CustomTypeormEntityBase {
    static tableName = 'job_assessment';
    job_assessment_id = CustomTypeormFields.AutoPK({
        db_column: 'job_assessment_id',
    });
    assessment_id = CustomTypeormFields.CharacterString({
        db_column: 'assessment_id',
    });
    candidate = CustomTypeormFields.FK({
        model_name: 'job_candidate',
        db_column: 'candidate_id',
    });
    reviewer = CustomTypeormFields.FK({
        model_name: 'team_member',
        db_column: 'member_id',
    });
    sent_on = CustomTypeormFields.CharacterString({ db_column: 'sent_on' });
    due_on = CustomTypeormFields.CharacterString({ db_column: 'due_on' });
    submitted_on = CustomTypeormFields.CharacterString({
        db_column: 'submitted_on',
    });
    submission_link = CustomTypeormFields.CharacterString({
        db_column: 'submission_link',
    });
    score = CustomTypeormFields.Integer({ db_column: 'score' });
    result = CustomTypeormFields.CharacterString({ db_column: 'result' });
    reviewed_on = CustomTypeormFields.CharacterString({
        db_column: 'reviewed_on',
    });
}
