import {getLatestFormSnapshotInput} from './model';
import {formSnapshot , form} from '@repo/database/models/form-schema';
import {db} from '@repo/database';


export default class FormSnapshot {
    public async getLatestFormSnapshotInput(formId: string) {}
}