import {EntitySchemaDatatype} from '../schema/entity-schema-datatype';
import {AttendanceModel} from '../../notes/attendance.model';

export const attendanceEntitySchemaDatatype: EntitySchemaDatatype = {
  name: 'attendancemodel',

  transformToDatabaseFormat: (value) => {
    return JSON.stringify(value);
  },

  transformToObjectFormat: (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return value.map(v => new AttendanceModel(v));
    }
  },
};
