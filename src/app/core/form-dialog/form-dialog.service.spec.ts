import { TestBed } from "@angular/core/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { FormDialogService } from "./form-dialog.service";
import { Component, EventEmitter, Input } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Entity } from "../entity/entity";
import { ShowsEntity } from "./shows-entity.interface";
import { FormDialogModule } from "./form-dialog.module";
import { FormDialogWrapperComponent } from "./form-dialog-wrapper/form-dialog-wrapper.component";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";

describe("FormDialogService", () => {
  let service: FormDialogService;

  let mockConfirmationDialog: jasmine.SpyObj<ConfirmationDialogService>;

  beforeEach(() => {
    mockConfirmationDialog = jasmine.createSpyObj("mockConfirmationDialog", [
      "openDialog",
    ]);

    TestBed.configureTestingModule({
      imports: [
        FormDialogModule,
        MatDialogModule,
        NoopAnimationsModule,
        Angulartics2Module.forRoot(),
        RouterTestingModule,
      ],
      declarations: [TestComponent],
      providers: [
        {
          provide: ConfirmationDialogService,
          useValue: mockConfirmationDialog,
        },
      ],
    });

    service = TestBed.inject<FormDialogService>(FormDialogService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should open dialog with given entity", () => {
    const testEntity: any = { name: "test" };
    const dialogRef = service.openDialog(TestComponent, testEntity);

    expect(dialogRef).toBeDefined();
    expect(dialogRef.componentInstance.entity).toEqual(testEntity);
  });

  it("should close dialog on form onClose", () => {
    const testEntity: any = { name: "test" };
    const dialogRef = service.openDialog(TestComponent, testEntity);

    spyOn(dialogRef, "close");
    dialogRef.componentInstance.formDialogWrapper.onClose.emit();

    expect(dialogRef.close).toHaveBeenCalled();
  });
});

@Component({
  selector: "app-test-component",
  template: "<div></div>",
})
class TestComponent implements ShowsEntity<Entity> {
  @Input() entity: Entity;

  // @ts-ignore
  formDialogWrapper: FormDialogWrapperComponent = {
    onClose: new EventEmitter<Entity>(),
    isFormDirty: false,
  };
}
