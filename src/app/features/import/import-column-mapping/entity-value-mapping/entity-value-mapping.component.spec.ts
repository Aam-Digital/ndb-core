import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityValueMappingComponent } from "./entity-value-mapping.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MappingDialogData } from "../import-column-mapping.component";
import { Child } from "../../../../child-dev-project/children/model/child";
import {
  entityRegistry,
  EntityRegistry,
} from "../../../../core/entity/database-entity.decorator";
import { ChildSchoolRelation } from "../../../../child-dev-project/children/model/childSchoolRelation";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ConfirmationDialogService } from "../../../../core/confirmation-dialog/confirmation-dialog.service";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { HarnessLoader } from "@angular/cdk/testing";
import { MatSelectHarness } from "@angular/material/select/testing";

describe("EntityValueMappingComponent", () => {
  let component: EntityValueMappingComponent;
  let fixture: ComponentFixture<EntityValueMappingComponent>;
  let loader: HarnessLoader;
  let data: MappingDialogData;

  beforeEach(() => {
    data = {
      values: [],
      col: { column: "", propertyName: "childId" },
      entityType: ChildSchoolRelation,
    };
    TestBed.configureTestingModule({
      imports: [EntityValueMappingComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    });
    fixture = TestBed.createComponent(EntityValueMappingComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show all properties of the provided entity that have a label", () => {
    const childPropertiesWithLabel = [...Child.schema.entries()]
      .filter(([_, schema]) => !!schema.label)
      .map(([property, schema]) => ({ property, label: schema.label }));
    expect(component.availableProperties).toEqual(childPropertiesWithLabel);
  });

  it("should show confirmation dialog if no property is selected", () => {
    const confirmationSpy = spyOn(
      TestBed.inject(ConfirmationDialogService),
      "getConfirmation",
    );
    component.propertyForm.setValue(undefined);

    component.save();

    expect(confirmationSpy).toHaveBeenCalled();
  });

  it("should assign property to additional on save", async () => {
    const select = await loader.getHarness(MatSelectHarness);

    await select.clickOptions({ text: "Name" });
    await component.save();

    expect(data.col.additional).toBe("name");
  });
});
