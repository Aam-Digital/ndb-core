import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { FormDialogWrapperComponent } from "./form-dialog-wrapper.component";
import { FormDialogModule } from "../form-dialog.module";
import { EntityMapperService } from "../../entity/entity-mapper.service";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { Subject } from "rxjs";

describe("FormDialogWrapperComponent", () => {
  let component: FormDialogWrapperComponent;
  let fixture: ComponentFixture<FormDialogWrapperComponent>;

  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(
    waitForAsync(() => {
      mockEntityMapper = jasmine.createSpyObj("mockEntityMapper", ["save"]);

      TestBed.configureTestingModule({
        imports: [
          FormDialogModule,
          Angulartics2Module.forRoot(),
          RouterTestingModule,
        ],
        providers: [
          { provide: EntityMapperService, useValue: mockEntityMapper },
          { provide: MatDialogRef, useValue: {} },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(FormDialogWrapperComponent);
    component = fixture.componentInstance;
    component.contentForm = {
      form: { dirty: false, statusChanges: new Subject() },
    };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should reset entity on cancel", async () => {
    const testEntity: any = { value: 1 };
    component.entity = testEntity;

    testEntity.value = 2;
    // @ts-ignore
    expect(component.entity.value).toBe(2);

    await component.cancel();
    expect(testEntity.value).toBe(1);
  });

  it("should save without beforeSave hook", async () => {
    const testEntity: any = { value: 1 };
    component.entity = testEntity;

    await component.save();

    expect(mockEntityMapper.save).toHaveBeenCalledWith(testEntity);
  });

  it("should allow aborting save", async () => {
    const testEntity: any = { value: 1 };
    component.entity = testEntity;
    component.beforeSave = () => undefined; // abort save by returning undefined from the beforeSave transformation hook
    spyOn(component, "beforeSave").and.callThrough();

    await component.save();

    expect(component.beforeSave).toHaveBeenCalledWith(testEntity);
    expect(mockEntityMapper.save).not.toHaveBeenCalled();
  });

  it("should save entity as transformed by beforeSave", async () => {
    const testEntity: any = { value: 1 };
    component.entity = testEntity;
    const transformedEntity: any = { value: 99 };
    component.beforeSave = () => Promise.resolve(transformedEntity);
    spyOn(component, "beforeSave").and.callThrough();

    await component.save();

    expect(component.beforeSave).toHaveBeenCalledWith(testEntity);
    expect(mockEntityMapper.save).toHaveBeenCalledWith(transformedEntity);
  });
});
