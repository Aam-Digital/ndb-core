import { Entity } from "../../core/entity/model/entity";
import { makeCustomMatcher } from "./custom-matcher-utils";

const entityMatchers: jasmine.CustomMatcherFactories = {
  toHaveId: (util) => {
    return makeCustomMatcher(
      (entity: Entity, id: string) => entity.getId() === id,
      (entity, id) =>
        `Expected entity ${util.pp(
          entity,
        )} to have ID '${id}' but it has ID ${entity.getId()}`,
      (entity, id) =>
        `Expected entity ${util.pp(
          entity,
        )} not to have ID '${id}' but it actually has ID ${entity.getId()}`,
    );
  },
  toHaveType: (util) => {
    return makeCustomMatcher(
      (entity: Entity, type: string) => entity.getType() === type,
      (entity, type) =>
        `Expected entity ${util.pp(
          entity,
        )} to have type '${type}' but it has type ${entity.getId()}`,
      (entity, type) =>
        `Expected entity ${util.pp(
          entity,
        )} not to have type '${type}' but it actually has type ${entity.getId()}`,
    );
  },
};

beforeAll(() => {
  jasmine.addMatchers(entityMatchers);
});
