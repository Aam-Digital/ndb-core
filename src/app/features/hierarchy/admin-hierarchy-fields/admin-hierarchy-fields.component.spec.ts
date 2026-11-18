import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { MatSelectHarness } from "@angular/material/select/testing";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { DatabaseEntity } from "#src/app/core/entity/database-entity.decorator";
import { DatabaseField } from "#src/app/core/entity/database-field.decorator";
import { Entity } from "#src/app/core/entity/model/entity";
import { EntityListConfig } from "#src/app/core/entity-list/EntityListConfig";
import { AdminHierarchyFieldsComponent } from "./admin-hierarchy-fields.component";

@DatabaseEntity("AdminHierarchyTestAction")
class Action extends Entity {
  @DatabaseField({
    label: { "en-US": "Parent action", de: "Übergeordnete Aktion" } as never,
    dataType: "entity",
    additional: "AdminHierarchyTestAction",
  })
  parent: string;
  @DatabaseField({
    label: "Depends on",
    dataType: "entity",
    additional: "AdminHierarchyTestAction",
  })
  dependsOn: string;
  @DatabaseField({
    label: "Blocks",
    dataType: "entity",
    additional: "AdminHierarchyTestAction",
    isArray: true,
  })
  blocks: string[];
  @DatabaseField({ label: "Owner", dataType: "entity", additional: "User" })
  owner: string;
}

describe("AdminHierarchyFieldsComponent", () => {
  let fixture: ComponentFixture<AdminHierarchyFieldsComponent>;
  let config: EntityListConfig;

  async function openSelect(hierarchyFields?: string[]) {
    config = { entityType: Action.ENTITY_TYPE } as EntityListConfig;
    if (hierarchyFields) {
      config.dataSource = { name: "hierarchy", config: { hierarchyFields } };
    }
    fixture.componentRef.setInput("entityConstructor", Action);
    fixture.componentRef.setInput("config", config);
    const select =
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatSelectHarness,
      );
    await select.open();
    return select;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminHierarchyFieldsComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(AdminHierarchyFieldsComponent);
  });

  it("offers only links to one record of the same type, by their label in the active language", async () => {
    const select = await openSelect();

    const options = await select.getOptions();
    expect(await Promise.all(options.map((o) => o.getText()))).toEqual([
      "Parent action",
      "Depends on",
    ]);
  });

  it("keeps the fields in the order of selection, as the first one is the default", async () => {
    const select = await openSelect();

    await select.clickOptions({ text: "Depends on" });
    await select.clickOptions({ text: "Parent action" });

    expect(config.dataSource).toEqual({
      name: "hierarchy",
      config: { hierarchyFields: ["dependsOn", "parent"] },
    });
  });

  it("removes the hierarchy from the list when no field is selected", async () => {
    const select = await openSelect(["parent"]);

    await select.clickOptions({ text: "Parent action" });

    expect(config.dataSource).toBeUndefined();
  });
});
