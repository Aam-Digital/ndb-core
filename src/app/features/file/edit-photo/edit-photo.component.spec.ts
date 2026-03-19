import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditPhotoComponent } from "./edit-photo.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FileService } from "../file.service";
import { AlertService } from "../../../core/alerts/alert.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { of } from "rxjs";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { FormControl } from "@angular/forms";
import { Entity } from "../../../core/entity/model/entity";
import { MatDialog } from "@angular/material/dialog";
import { NAVIGATOR_TOKEN } from "../../../utils/di-tokens";

describe("EditPhotoComponent", () => {
  let component: EditPhotoComponent;
  let fixture: ComponentFixture<EditPhotoComponent>;
  let mockFileService: any;
  let mockAlertService: any;
  let mockEntityMapper: any;
  let mockDialog: any;

  beforeEach(async () => {
    mockFileService = {
      uploadFile: vi.fn(),
      loadFile: vi.fn(),
      removeFile: vi.fn(),
    };
    mockFileService.removeFile.mockReturnValue(of(undefined));
    mockAlertService = {
      addDanger: vi.fn(),
      addInfo: vi.fn(),
    };
    mockEntityMapper = {
      save: vi.fn(),
    };
    mockDialog = {
      open: vi.fn(),
    };
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
        { provide: NAVIGATOR_TOKEN, useValue: { onLine: true } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditPhotoComponent);
    component = fixture.componentInstance;

    // Set up the component's ngControl to point to our form control
    const formControl = new FormControl();
    component.ngControl = {
      control: formControl,
    } as any;

    component.entity = new Entity();
    component.formFieldConfig = { id: "testProp" };
    component.ngOnInit();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the image once it is selected", async () => {
    const mockedCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue({ drawImage: vi.fn() }),
      toDataURL: vi.fn().mockReturnValue("data:image/png;base64,mocked"),
      toBlob: (cb: (blob: Blob) => void) =>
        cb(new Blob(["reduced-image"], { type: "image/png" })),
    } as unknown as HTMLCanvasElement;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string) => {
        if (tagName === "canvas") {
          return mockedCanvas;
        }
        return originalCreateElement(tagName as any);
      });
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test-file");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const OriginalImage = window.Image;
    Object.defineProperty(window, "Image", {
      configurable: true,
      value: class {
        width = 500;
        height = 300;
        private _src: string | undefined;
        private _onload: (() => void) | undefined;
        set src(value: string) {
          this._src = value;
          if (this._onload) {
            queueMicrotask(() => this._onload?.());
          }
        }
        get onload() {
          return this._onload;
        }
        set onload(handler: (() => void) | undefined) {
          this._onload = handler;
          if (this._src && handler) {
            queueMicrotask(() => handler());
          }
        }
      },
    });

    try {
      const realFile = new File(["raw-image"], "image.png", {
        type: "image/png",
      });

      await component.onFileSelected(realFile);

      expect(component.imgPath).toEqual("data:image/png;base64,mocked");
    } finally {
      createElementSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      Object.defineProperty(window, "Image", {
        configurable: true,
        value: OriginalImage,
      });
    }
  });

  it("should load the picture on initialisation", () => {
    mockFileService.loadFile.mockReturnValue(of("some.path"));
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
    mockFileService.loadFile.mockReturnValue(of("initial.path"));
    component.formControl.setValue("initial.image");
    component.ngOnInit();

    component.imgPath = "new.path";
    component.formControl.disable();

    expect(component.imgPath).toBe("initial.path");
  });

  it("should revoke initial image if file is deleted", () => {
    mockFileService.loadFile.mockReturnValue(of("initial.path"));
    component.formControl.setValue("initial.image");
    component.ngOnInit();

    component.delete();
    component.formControl.disable();

    expect(component.imgPath).toBe("assets/child.png");
  });

  it("should open a popup with the image when click on it", () => {
    component.imgPath = "some.image";

    component.openPopup();

    expect(mockDialog.open).toHaveBeenCalledWith(expect.anything(), {
      data: { url: "some.image" },
    });
  });
});
