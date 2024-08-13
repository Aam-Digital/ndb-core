import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Entity } from "../../core/entity/model/entity";
import { DatabaseField } from "../../core/entity/database-field.decorator";

/**
 * Basic Entity type for unit tests, so that we don't have to create custom entity classes for every test.
 */
@DatabaseEntity("TestEntity")
export class TestEntity extends Entity {
  static toStringAttributes = ["name"];
  static label = "Test Entity";
  static labelPlural = "Test Entities";
  static override hasPII = true;

  @DatabaseField({
    label: "Name",
  })
  name: string;
}
