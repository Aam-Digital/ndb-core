import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Entity } from "../../core/entity/model/entity";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { EntityDatatype } from "../../core/basic-datatypes/entity/entity.datatype";

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

  @DatabaseField({
    label: "Reference",
    dataType: EntityDatatype.dataType,
    additional: TestEntity.ENTITY_TYPE,
  })
  ref: string;

  static create(data: Partial<TestEntity>): TestEntity {
    return Object.assign(new TestEntity(), data);
  }
}
