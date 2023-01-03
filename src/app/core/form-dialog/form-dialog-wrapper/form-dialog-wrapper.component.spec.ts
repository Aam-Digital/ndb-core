import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { FormDialogWrapperComponent } from "./form-dialog-wrapper.component";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { MatDialogRef } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { Child } from "../../../child-dev-project/children/model/child";

describe("FormDialogWrapperComponent", () => {
  let component: FormDialogWrapperComponent<Child>;
  let fixture: ComponentFixture<FormDialogWrapperComponent>;

  let saveEntitySpy: jasmine.Spy;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormDialogWrapperComponent, MockedTestingModule.withState()],
      providers: [{ provide: MatDialogRef, useValue: {} }],
    }).compileComponents();

    saveEntitySpy = spyOn(TestBed.inject(EntityMapperService), "save");
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormDialogWrapperComponent);
    component = fixture.componentInstance as FormDialogWrapperComponent<Child>;
    component.contentForm = {
      form: { dirty: false, statusChanges: new Subject() },
    };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reset entity on cancel", async () => {
    const testEntity = Child.create("old name");
    component.entity = testEntity;

    testEntity.name = "new name";
    expect(component.entity.name).toBe("new name");

    await component.cancel();
    expect(testEntity.name).toBe("old name");
  });

  it("should save without beforeSave hook", async () => {
    const testEntity = new Child();

    component.entity = testEntity;

    await component.save();

    expect(saveEntitySpy).toHaveBeenCalledWith(testEntity);
  });

  it("should allow aborting save", async () => {
    const testEntity = new Child();
    component.entity = testEntity;
    component.beforeSave = () => undefined; // abort save by returning undefined from the beforeSave transformation hook
    spyOn(component, "beforeSave").and.callThrough();

    await component.save();

    expect(component.beforeSave).toHaveBeenCalledWith(testEntity);
    expect(saveEntitySpy).not.toHaveBeenCalled();
  });

  it("should save entity as transformed by beforeSave", async () => {
    const testEntity = Child.create("old name");
    component.entity = testEntity;
    const transformedEntity = Child.create("transformed name");
    component.beforeSave = () => Promise.resolve(transformedEntity);
    spyOn(component, "beforeSave").and.callThrough();

    await component.save();

    expect(component.beforeSave).toHaveBeenCalledWith(testEntity);
    expect(saveEntitySpy).toHaveBeenCalledWith(transformedEntity);
  });
});
