import {EntitySchemaDatatype} from '../schema/entity-schema-datatype';
import {AttendanceModel} from '../../notes/attendance.model';

export const attendanceEntitySchemaDatatype: EntitySchemaDatatype = {
  name: 'attendancemodel',

  transformToDatabaseFormat: (value) => {
    return JSON.stringify(value);
  },

  transformToObjectFormat: (value) => {
    // We need this try-catch phrase to update any legacy values.
    // If the value is old, the parameter 'value' is a String-array containing the child-ID's.
    // If the value has already been updated, it is a JSON-String containing the attendance-models
    // (A single attendance model is an array of triplets; childID, attendance and remarks)
    // If it is a String-array, one can retrieve the attendance-models by simply mapping each ID to a new AttendanceModel.
    // This will result in an attendance model that has all fields (except the childID) set to it's default value
    // If the fetched data can be parsed as a JSON-String, simply de-serialize and return it.
    try {
      return JSON.parse(value);
    } catch {
      return value.map(v => new AttendanceModel(v));
    }
  },
};
