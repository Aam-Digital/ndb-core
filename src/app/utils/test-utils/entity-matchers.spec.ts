import { Entity } from "../../core/entity/model/entity";
import { makeCustomMatcher } from "./custom-matcher-utils";

const entityMatchers: jasmine.CustomMatcherFactories = {
  toHaveType: (util) => {
    return makeCustomMatcher(
      (entity: Entity, type: string) => entity.getType() === type,
      (entity, type) =>
        `Expected entity ${util.pp(
          entity,
        )} to have type '${type}' but it has type ${entity.getId(true)}`,
      (entity, type) =>
        `Expected entity ${util.pp(
          entity,
        )} not to have type '${type}' but it actually has type ${entity.getId(
          true,
        )}`,
    );
  },
};

beforeAll(() => {
  jasmine.addMatchers(entityMatchers);
});
