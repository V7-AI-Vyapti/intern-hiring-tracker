import { CustomTypeormEntityBase, CustomTypeormFields } from '@vyapti/core';
export class JobInterview extends CustomTypeormEntityBase {
    static tableName = 'job_interview';
    status = CustomTypeormFields.CharacterString({ db_column: 'status' });
    candidate = CustomTypeormFields.FK({
        model_name: 'job_candidate',
        db_column: 'candidate_id',
    });
    job_interview_id = CustomTypeormFields.AutoPK({
        db_column: 'job_interview_id',
    });
    interview_id = CustomTypeormFields.CharacterString({
        db_column: 'interview_id',
    });
    round = CustomTypeormFields.Integer({ db_column: 'round' });
    interviewer = CustomTypeormFields.FK({
        model_name: 'team_member',
        db_column: 'member_id',
    });
    scheduled_at = CustomTypeormFields.CharacterString({
        db_column: 'scheduled_at',
    });
    mode = CustomTypeormFields.CharacterString({ db_column: 'mode' });
    rating = CustomTypeormFields.Integer({ db_column: 'rating' });
    recommendation = CustomTypeormFields.CharacterString({
        db_column: 'recommendation',
    });
    feedback = CustomTypeormFields.Text({ db_column: 'feedback' });
    feedback_on = CustomTypeormFields.CharacterString({
        db_column: 'feedback_on',
    });
}
