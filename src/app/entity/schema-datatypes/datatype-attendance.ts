import {EntitySchemaDatatype} from '../schema/entity-schema-datatype';

export const attendanceEntitySchemaDatatype: EntitySchemaDatatype = {
  name: 'attendancemodel',

  transformToDatabaseFormat: (value) => {
    return JSON.stringify(value);
  },

  transformToObjectFormat: (value) => {
    return JSON.parse(value);
  },
};
