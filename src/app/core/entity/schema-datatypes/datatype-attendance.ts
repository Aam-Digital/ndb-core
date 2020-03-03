import { EntitySchemaDatatype } from '../schema/entity-schema-datatype';
import { MeetingNoteAttendance } from '../../../child-dev-project/notes/meeting-note-attendance';

export const attendanceEntitySchemaDatatype: EntitySchemaDatatype = {
  name: 'meetingnoteattendance',

  transformToDatabaseFormat: (value) => {return value; },

  transformToObjectFormat: (value) => {
    // If the value is null or undefined (should never occur), return an empty array
    if (!value) { return []; }
    // if the value is a string, return a new AttendanceModel-array with the value as the id
    if (typeof value === 'string') {return [new MeetingNoteAttendance(value)]; }
    // if the value is an array, we need to check if the array contains strings or attendanceModels.
    // If the value is not a string, it is assumed to be an AttendanceModel.
    // Since nothing else is saved to the db, this should always be true
    if (value instanceof Array) {
      return value.map(v => typeof v === 'string' ? new MeetingNoteAttendance(v) : v );
    }
    return [];
  },
};
