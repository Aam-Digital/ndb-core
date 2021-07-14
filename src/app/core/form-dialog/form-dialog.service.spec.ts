import { TestBed } from "@angular/core/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { FormDialogService } from "./form-dialog.service";
import { Component, EventEmitter, Input } from "@angular/core";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { Entity } from "../entity/model/entity";
import { ShowsEntity } from "./shows-entity.interface";
import { FormDialogModule } from "./form-dialog.module";
import { FormDialogWrapperComponent } from "./form-dialog-wrapper/form-dialog-wrapper.component";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { Angulartics2Module } from "angulartics2";
import { RouterTestingModule } from "@angular/router/testing";
import { OnInitDynamicComponent } from "../view/dynamic-components/on-init-dynamic-component.interface";

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

  it("should close dialog on form close", () => {
    const testEntity: any = { name: "test" };
    const dialogRef = service.openDialog(TestComponent, testEntity);

    spyOn(dialogRef, "close");
    dialogRef.componentInstance.formDialogWrapper.closed.emit();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it("should call onInitFromDynamicConfig on open if it exists", () => {
    @Component({
      selector: "app-test-component",
      template: "<div></div>",
    })
    class TestDynamicComponent
      implements ShowsEntity<Entity>, OnInitDynamicComponent
    {
      @Input() entity: Entity;
      public hasCalledInitFromDynamicConfig = false;

      // @ts-ignore
      formDialogWrapper: FormDialogWrapperComponent = {
        closed: new EventEmitter<Entity>(),
        isFormDirty: false,
      };

      onInitFromDynamicConfig(config: any) {
        this.hasCalledInitFromDynamicConfig = true;
      }
    }

    const testEntity: any = { name: "test" };
    const dialogRef = service.openDialog(TestDynamicComponent, testEntity);

    expect(dialogRef).toBeDefined();
    expect(
      dialogRef.componentInstance.hasCalledInitFromDynamicConfig
    ).toBeTrue();
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
    closed: new EventEmitter<Entity>(),
    isFormDirty: false,
  };
}
