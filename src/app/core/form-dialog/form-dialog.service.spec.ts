import { TestBed } from "@angular/core/testing";
import { FormDialogService } from "./form-dialog.service";
import { Component, Input, ViewChild } from "@angular/core";
import { Entity } from "../entity/model/entity";
import { ShowsEntity } from "./shows-entity.interface";
import { FormDialogWrapperComponent } from "./form-dialog-wrapper/form-dialog-wrapper.component";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { MockedTestingModule } from "../../utils/mocked-testing.module";
import { FormsModule } from "@angular/forms";

describe("FormDialogService", () => {
  let service: FormDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState(), TestComponent],
      providers: [
        {
          provide: ConfirmationDialogService,
          useValue: jasmine.createSpyObj(["getConfirmation"]),
        },
      ],
    });

    service = TestBed.inject<FormDialogService>(FormDialogService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should open dialog with given entity", () => {
    const testEntity = new Entity();
    const dialogRef = service.openDialog(TestComponent, testEntity);

    expect(dialogRef).toBeDefined();
    expect(dialogRef.componentInstance.entity).toEqual(testEntity);
  });

  it("should close dialog on form close", () => {
    const dialogRef = service.openDialog(TestComponent, new Entity());

    spyOn(dialogRef, "close");
    dialogRef.componentInstance.formDialogWrapper.close.emit();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it("should get columns from schema fields marked showInDetailsView", () => {
    @DatabaseEntity("TestWithShowInDetails")
    class TestWithShowInDetails extends Entity {
      @DatabaseField({ showInDetailsView: true }) shown;
      @DatabaseField({ showInDetailsView: false }) hidden;
      @DatabaseField() ignored;
    }

    const actualFields = FormDialogService.getSchemaFieldsForDetailsView(
      new TestWithShowInDetails()
    );

    expect(actualFields.map((x) => x.id)).toEqual(["shown"]);
  });

  it("should get all columns of entity (without generic Entity fields) if showInDetailsView flag is not used", () => {
    @DatabaseEntity("TestWithoutShowInDetails")
    class TestWithoutShowInDetails extends Entity {
      @DatabaseField() field1;
      @DatabaseField() field2;
    }

    const actualFields = FormDialogService.getSchemaFieldsForDetailsView(
      new TestWithoutShowInDetails()
    );

    expect(actualFields.map((x) => x.id)).toEqual(["field1", "field2"]);
  });
});

@Component({
  selector: "app-test-component",
  template: ` <app-form-dialog-wrapper [entity]="entity">
    <form #entityForm="ngForm"></form>
  </app-form-dialog-wrapper>`,
  standalone: true,
  imports: [FormDialogWrapperComponent, FormsModule],
})
class TestComponent implements ShowsEntity<Entity> {
  @Input() entity: Entity;

  @ViewChild(FormDialogWrapperComponent, { static: true }) formDialogWrapper;
}
