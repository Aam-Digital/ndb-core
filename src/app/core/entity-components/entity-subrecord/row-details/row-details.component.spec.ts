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
import { EntityFormService } from "../../entity-form/entity-form.service";
import { AlertService } from "../../../alerts/alert.service";
import { EntityAbility } from "../../../permissions/ability/entity-ability";
import { Child } from "../../../../child-dev-project/children/model/child";
import { Router } from "@angular/router";

describe("RowDetailsComponent", () => {
  let component: RowDetailsComponent;
  let fixture: ComponentFixture<RowDetailsComponent>;
  let detailsComponentData: DetailsComponentData;

  beforeEach(async () => {
    detailsComponentData = {
      entity: new Entity(),
      columns: [],
    };
    await TestBed.configureTestingModule({
      imports: [RowDetailsComponent, MockedTestingModule.withState()],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: detailsComponentData },
        { provide: MatDialogRef, useValue: {} },
      ],
    }).compileComponents();
    spyOn(TestBed.inject(EntityAbility), "cannot").and.returnValue(true);
  });

  function initComponent() {
    fixture = TestBed.createComponent(RowDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it("should create", () => {
    initComponent();
    expect(component).toBeTruthy();
  });

  it("should close the dialog when saving is successful", fakeAsync(() => {
    initComponent();
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
    initComponent();
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
    initComponent();
    expect(component.form.disabled).toBeFalsy();
  });

  it("should create the details route", () => {
    const child = new Child();
    child._rev = "existing";
    detailsComponentData.entity = child;
    TestBed.inject(Router).resetConfig([
      { path: "child/:id", redirectTo: "/" },
    ]);

    initComponent();

    expect(component.detailsRoute).toBe(`${Child.route}/${child.getId()}`);
  });
});
