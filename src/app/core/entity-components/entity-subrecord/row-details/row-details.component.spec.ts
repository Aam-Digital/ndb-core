import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import {
  DetailsComponentData,
  RowDetailsComponent,
} from "./row-details.component";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Entity } from "../../../entity/model/entity";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntitySubrecordModule } from "../entity-subrecord.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityFormService } from "../../entity-form/entity-form.service";
import { AlertService } from "../../../alerts/alert.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";

describe("RowDetailsComponent", () => {
  let component: RowDetailsComponent<any>;
  let fixture: ComponentFixture<RowDetailsComponent<any>>;
  const detailsComponentData: DetailsComponentData<any> = {
    entity: new Entity(),
    columns: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EntitySubrecordModule,
        MockedTestingModule.withState(),
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: detailsComponentData },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
    spyOn(TestBed.inject(EntityAbility), "cannot").and.returnValue(true);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RowDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should close the dialog when saving is successful", fakeAsync(() => {
    const formService = TestBed.inject(EntityFormService);
    const result = new Entity();
    spyOn(formService, "saveChanges").and.resolveTo(result);
    const closeSpy = jasmine.createSpy();
    TestBed.inject(MatDialogRef).close = closeSpy;

    component.save();
    tick();

    expect(closeSpy).toHaveBeenCalledWith(result);
  }));

  it("should show an alert when saving fails", fakeAsync(() => {
    const formService = TestBed.inject(EntityFormService);
    const message = "Error message";
    spyOn(formService, "saveChanges").and.rejectWith(new Error(message));
    const alertSpy = jasmine.createSpy();
    TestBed.inject(AlertService).addDanger = alertSpy;
    const closeSpy = jasmine.createSpy();
    TestBed.inject(MatDialogRef).close = closeSpy;

    component.save();
    tick();

    expect(alertSpy).toHaveBeenCalledWith(message);
    expect(closeSpy).not.toHaveBeenCalled();
  }));

  it("should not disable the form when creating a new entity", () => {
    expect(component.form.disabled).toBeFalsy();
  });
});
