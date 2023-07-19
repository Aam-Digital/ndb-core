import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPhotoComponent } from "./edit-photo.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FileService } from "../../../../../features/file/file.service";
import { AlertService } from "../../../../alerts/alert.service";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { FormControl } from "@angular/forms";
import { Entity } from "../../../../entity/model/entity";
import { MatDialog } from "@angular/material/dialog";

describe("EditPhotoComponent", () => {
  let component: EditPhotoComponent;
  let fixture: ComponentFixture<EditPhotoComponent>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockAlertService: jasmine.SpyObj<AlertService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockFileService = jasmine.createSpyObj([
      "uploadFile",
      "loadFile",
      "removeFile",
    ]);
    mockFileService.removeFile.and.returnValue(of(undefined));
    mockAlertService = jasmine.createSpyObj(["addDanger", "addInfo"]);
    mockEntityMapper = jasmine.createSpyObj(["save"]);
    mockDialog = jasmine.createSpyObj(["open"]);
    await TestBed.configureTestingModule({
      imports: [
        EditPhotoComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        EntitySchemaService,
        { provide: AlertService, useValue: mockAlertService },
        { provide: FileService, useValue: mockFileService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
        { provide: MatDialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPhotoComponent);
    component = fixture.componentInstance;
    component.formControl = new FormControl();
    component.entity = new Entity();
    component.formFieldConfig = { id: "testProp" };
    component.ngOnInit();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the image once it is selected", async () => {
    const blob = await fetch("assets/child.png").then((res) => res.blob());
    const realFile = new File([blob], "image");

    await component.onFileSelected(realFile);

    expect(component.imgPath).toEqual(
      jasmine.stringContaining("data:image/png;base64,")
    );
  });

  it("should load the picture on initialisation", () => {
    mockFileService.loadFile.and.returnValue(of("some.path"));
    component.formControl.setValue("file.name");

    component.ngOnInit();

    expect(component.imgPath).toBe("some.path");
  });

  it("should display the default image when clicking delete", () => {
    component.imgPath = "some.path";

    component.delete();

    expect(component.imgPath).toBe("assets/child.png");
  });

  it("should reset the shown image when pressing cancel", () => {
    mockFileService.loadFile.and.returnValue(of("initial.path"));
    component.formControl.setValue("initial.image");
    component.ngOnInit();

    component.imgPath = "new.path";
    component.formControl.disable();

    expect(component.imgPath).toBe("initial.path");
  });

  it("should revoke initial image if file is deleted", () => {
    mockFileService.loadFile.and.returnValue(of("initial.path"));
    component.formControl.setValue("initial.image");
    component.ngOnInit();

    component.delete();
    component.formControl.disable();

    expect(component.imgPath).toBe("assets/child.png");
  });

  it("should open a popup with the image when click on it", () => {
    component.imgPath = "some.image";

    component.openPopup();

    expect(mockDialog.open).toHaveBeenCalledWith(jasmine.anything(), {
      data: { url: "some.image" },
    });
  });
});
