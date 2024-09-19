import { DatabaseEntity } from "../../core/entity/database-entity.decorator";
import { Entity } from "../../core/entity/model/entity";
import { DatabaseField } from "../../core/entity/database-field.decorator";
import { EntityDatatype } from "../../core/basic-datatypes/entity/entity.datatype";
import { ConfigurableEnumValue } from "../../core/basic-datatypes/configurable-enum/configurable-enum.interface";
import { ConfigurableEnumDatatype } from "../../core/basic-datatypes/configurable-enum/configurable-enum-datatype/configurable-enum.datatype";
import { DateWithAge } from "../../core/basic-datatypes/date-with-age/dateWithAge";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { EntityBlockConfig } from "../../core/basic-datatypes/entity/entity-block/entity-block-config";

/**
 * Basic Entity type for unit tests, so that we don't have to create custom entity classes for every test.
 */
@DatabaseEntity("TestEntity")
export class TestEntity extends Entity {
  static override ENTITY_TYPE = "TestEntity";

  static override toStringAttributes = ["name"];
  static override label = "Test Entity";
  static override labelPlural = "Test Entities";
  static override icon: IconName = "child";
  static override route = "test-entity";
  static override toBlockDetailsAttributes: EntityBlockConfig = {
    title: "name",
    fields: ["other", "category"],
  };
  static override hasPII = true;

  @DatabaseField({
    label: "Name",
  })
  name: string;

  @DatabaseField({
    label: "Other",
  })
  other: string;

  @DatabaseField({
    label: "Reference",
    dataType: EntityDatatype.dataType,
    additional: TestEntity.ENTITY_TYPE,
  })
  ref: string;

  @DatabaseField({
    label: "Category",
    dataType: ConfigurableEnumDatatype.dataType,
    additional: "genders",
  })
  category: ConfigurableEnumValue;

  @DatabaseField({
    label: "Date of Birth",
  })
  dateOfBirth: DateWithAge;

  static create(data: Partial<TestEntity> | string): TestEntity {
    if (typeof data === "string") {
      data = { name: data };
    }
    return Object.assign(new TestEntity(), data);
  }
}
