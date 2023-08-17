import { EntityTypeLabelPipe } from "./entity-type-label.pipe";
import { entityRegistry } from "../../../entity/database-entity.decorator";

describe("EntityTypeLabelPipe", () => {
  it("create an instance", () => {
    const pipe = new EntityTypeLabelPipe(entityRegistry);
    expect(pipe).toBeTruthy();
  });
});
