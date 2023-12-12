import { DatabaseEntity } from "./database-entity.decorator";
import { Entity } from "./model/entity";

describe("DatabaseEntityDecorator", () => {
  it("should use a new schema object", () => {
    @DatabaseEntity("OnlyEntityDecorator")
    class OnlyEntityDecorator extends Entity {}

    expect(OnlyEntityDecorator.schema).not.toBe(Entity.schema);
  });
});
