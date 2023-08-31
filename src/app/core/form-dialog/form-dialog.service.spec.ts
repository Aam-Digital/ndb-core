import { TestBed, waitForAsync } from "@angular/core/testing";
import { FormDialogService } from "./form-dialog.service";
import { Entity } from "../entity/model/entity";
import { ConfirmationDialogService } from "../common-components/confirmation-dialog/confirmation-dialog.service";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { MockedTestingModule } from "../../utils/mocked-testing.module";

describe("FormDialogService", () => {
  let service: FormDialogService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [
        {
          provide: ConfirmationDialogService,
          useValue: jasmine.createSpyObj(["getConfirmation"]),
        },
      ],
    });

    service = TestBed.inject<FormDialogService>(FormDialogService);
  }));

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should get columns from schema fields marked showInDetailsView", () => {
    @DatabaseEntity("TestWithShowInDetails")
    class TestWithShowInDetails extends Entity {
      @DatabaseField({ showInDetailsView: true }) shown;
      @DatabaseField({ showInDetailsView: false }) hidden;
      @DatabaseField() ignored;
    }

    const actualFields = FormDialogService.getSchemaFieldsForDetailsView(
      new TestWithShowInDetails(),
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
      new TestWithoutShowInDetails(),
    );

    expect(actualFields.map((x) => x.id)).toEqual(["field1", "field2"]);
  });
});
