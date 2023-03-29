import { ComponentFixture, TestBed } from "@angular/core/testing";

import { NewPhotoComponent } from "./new-photo.component";
import { FileService } from "../../../../../features/file/file.service";
import { AlertService } from "../../../../alerts/alert.service";
import { EntityMapperService } from "../../../../entity/entity-mapper.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { EntitySchemaService } from "../../../../entity/schema/entity-schema.service";
import { FormControl } from "@angular/forms";
import { Entity } from "../../../../entity/model/entity";
import { DomSanitizer } from "@angular/platform-browser";
import { of } from "rxjs";
import { EditPropertyConfig } from "../edit-component";

describe("NewPhotoComponent", () => {
  let component: NewPhotoComponent;
  let fixture: ComponentFixture<NewPhotoComponent>;
  let mockFileService: jasmine.SpyObj<FileService>;
  let mockAlertService: jasmine.SpyObj<AlertService>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;
  let config: EditPropertyConfig<string>;

  const file = { name: "test.file" } as File;
  const fileEvent = { target: { files: [file] } };

  beforeEach(async () => {
    mockFileService = jasmine.createSpyObj([
      "uploadFile",
      "loadFile",
      "removeFile",
    ]);
    mockFileService.removeFile.and.returnValue(of(undefined));
    mockAlertService = jasmine.createSpyObj(["addDanger", "addInfo"]);
    mockEntityMapper = jasmine.createSpyObj(["save"]);
    await TestBed.configureTestingModule({
      imports: [
        NewPhotoComponent,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        EntitySchemaService,
        { provide: AlertService, useValue: mockAlertService },
        { provide: FileService, useValue: mockFileService },
        { provide: EntityMapperService, useValue: mockEntityMapper },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewPhotoComponent);
    component = fixture.componentInstance;
    config = {
      formControl: new FormControl(),
      entity: new Entity(),
      formFieldConfig: { id: "testProp" },
      propertySchema: undefined,
    };
    component.onInitFromDynamicConfig(config);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the image once it is selected", () => {
    spyOn(
      TestBed.inject(DomSanitizer),
      "bypassSecurityTrustUrl"
    ).and.returnValue("image.path");
    spyOn(URL, "createObjectURL");

    component.onFileSelected(fileEvent);

    expect(component.imgPath).toBe("image.path");
  });

  it("should load the picture on initialisation", () => {
    mockFileService.loadFile.and.returnValue(of("some.path"));
    config.entity[config.formFieldConfig.id] = "file.name";

    component.onInitFromDynamicConfig(config);

    expect(component.imgPath).toBe("some.path");
  });

  it("should display the default image when clicking delete", () => {
    component.imgPath = "some.path";

    component.delete();

    expect(component.imgPath).toBe("assets/child.png");
  });

  it("should reset the shown image when pressing cancel", () => {
    mockFileService.loadFile.and.returnValue(of("initial.path"));
    config.entity[config.formFieldConfig.id] = "initial.image";
    component.onInitFromDynamicConfig(config);

    component.imgPath = "new.path";
    component.formControl.disable();

    expect(component.imgPath).toBe("initial.path");
  });

  it("should revoke initial image if file is deleted", () => {
    mockFileService.loadFile.and.returnValue(of("initial.path"));
    config.entity[config.formFieldConfig.id] = "initial.image";
    config.formControl.setValue("initial.image");
    component.onInitFromDynamicConfig(config);
    component.ngOnInit();

    component.delete();
    component.formControl.disable();

    expect(component.imgPath).toBe("assets/child.png");
  });
});
