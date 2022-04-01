import { Entity } from "../core/entity/model/entity";

const entityMatchers: jasmine.CustomMatcherFactories = {
  toHaveId: (util) => {
    return {
      compare: (entity: Entity, id: string) => {
        const result = { pass: false, message: "" };
        if (entity.getId() === id) {
          result.pass = true;
        } else {
          result.message = `Expected entity ${util.pp(
            entity
          )} to have ID '${id}' but it has ID ${entity.getId()}`;
        }
        return result;
      },
    };
  },
  toHaveType: (util) => {
    return {
      compare: (entity: Entity, type: string) => {
        const result = { pass: false, message: "" };
        if (entity.getType() === type) {
          result.pass = true;
        } else {
          result.message = `Expected entity ${util.pp(
            entity
          )} to have type '${type}' but it has type ${entity.getId()}`;
        }
        return result;
      },
    };
  },
};

beforeAll(() => {
  jasmine.addMatchers(entityMatchers);
});
