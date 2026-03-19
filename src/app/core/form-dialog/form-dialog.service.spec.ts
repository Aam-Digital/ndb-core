import { TestBed, waitForAsync } from "@angular/core/testing";
import { FormDialogService } from "./form-dialog.service";
import { Entity } from "../entity/model/entity";
import { DatabaseEntity } from "../entity/database-entity.decorator";
import { DatabaseField } from "../entity/database-field.decorator";
import { EntityConfigService } from "../entity/entity-config.service";
import { MatDialog } from "@angular/material/dialog";
import { DialogViewComponent } from "../ui/dialog-view/dialog-view.component";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";

describe("FormDialogService", () => {
  let service: FormDialogService;
  let entityConfigServiceMock: any;
  let dialogMock: any;

  beforeEach(waitForAsync(() => {
    entityConfigServiceMock = {
      getDetailsViewConfig: vi
        .fn()
        .mockName("EntityConfigService.getDetailsViewConfig"),
    };
    dialogMock = {
      open: vi.fn().mockName("MatDialog.open"),
    };
    const schemaServiceMock = {
      getComponent: vi.fn().mockName("EntitySchemaService.getComponent"),
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: MatDialog,
          useValue: dialogMock,
        },
        {
          provide: EntityConfigService,
          useValue: entityConfigServiceMock,
        },
        {
          provide: EntitySchemaService,
          useValue: schemaServiceMock,
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
      @DatabaseField({ showInDetailsView: true })
      shown;
      @DatabaseField({ showInDetailsView: false })
      hidden;
      @DatabaseField()
      ignored;
    }

    const actualFields = FormDialogService.getSchemaFieldsForDetailsView(
      new TestWithShowInDetails(),
    );

    expect(actualFields.map((x) => x.id)).toEqual(["shown"]);
  });

  it("should get all columns of entity (without generic Entity fields) if showInDetailsView flag is not used", () => {
    @DatabaseEntity("TestWithoutShowInDetails")
    class TestWithoutShowInDetails extends Entity {
      @DatabaseField()
      field1;
      @DatabaseField()
      field2;
    }

    const actualFields = FormDialogService.getSchemaFieldsForDetailsView(
      new TestWithoutShowInDetails(),
    );

    expect(actualFields.map((x) => x.id)).toEqual(["field1", "field2"]);
  });

  it("should open EntityDetails by default when details view config is available", () => {
    const entity = new Entity();
    entityConfigServiceMock.getDetailsViewConfig.mockReturnValue({} as any);

    service.openView(entity);

    expect(dialogMock.open).toHaveBeenCalledWith(
      DialogViewComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          component: "EntityDetails",
          entity,
        }),
      }),
    );
  });

  it("should open NoteDetails by default for Note entities", () => {
    const note = new Note();
    entityConfigServiceMock.getDetailsViewConfig.mockReturnValue({} as any);

    service.openView(note);

    expect(dialogMock.open).toHaveBeenCalledWith(
      DialogViewComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          component: "NoteDetails",
          entity: note,
        }),
      }),
    );
  });

  it("should fall back to openFormPopup when details view config is missing", () => {
    const entity = new Entity();
    const openFormPopupSpy = vi
      .spyOn(service, "openFormPopup")
      .mockReturnValue({} as any);
    entityConfigServiceMock.getDetailsViewConfig.mockReturnValue(undefined);

    service.openView(entity);

    expect(openFormPopupSpy).toHaveBeenCalledWith(entity);
  });

  it("should fall back to openFormPopup when getting details view config throws", () => {
    const entity = new Entity();
    const openFormPopupSpy = vi
      .spyOn(service, "openFormPopup")
      .mockReturnValue({} as any);
    entityConfigServiceMock.getDetailsViewConfig.mockImplementation(() => {
      throw new Error("config not loaded");
    });

    service.openView(entity);

    expect(openFormPopupSpy).toHaveBeenCalledWith(entity);
  });
});
