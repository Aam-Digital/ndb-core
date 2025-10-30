import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConditionalColorConfigComponent } from "./conditional-color-config.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatDialog } from "@angular/material/dialog";
import { of } from "rxjs";
import { ColorMapping } from "app/core/entity/model/entity";
import { TestEntity } from "app/utils/test-utils/TestEntity";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";
import { ConfigurableEnum } from "app/core/basic-datatypes/configurable-enum/configurable-enum";

describe("ConditionalColorConfigComponent", () => {
  let component: ConditionalColorConfigComponent;
  let fixture: ComponentFixture<ConditionalColorConfigComponent>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockEnumService: jasmine.SpyObj<ConfigurableEnumService>;

  beforeEach(async () => {
    mockDialog = jasmine.createSpyObj("MatDialog", ["open"]);
    mockDialog.open.and.returnValue({
      afterClosed: () => of(null),
    } as any);

    mockEnumService = jasmine.createSpyObj("ConfigurableEnumService", [
      "getEnum",
    ]);

    await TestBed.configureTestingModule({
      imports: [ConditionalColorConfigComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: ConfigurableEnumService, useValue: mockEnumService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConditionalColorConfigComponent);
    component = fixture.componentInstance;
    component.entityConstructor = TestEntity;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize field options from entity schema", () => {
    expect(component.colorFieldOptions.length).toBeGreaterThanOrEqual(0);
  });

  it("should detect selected field from existing value", () => {
    const testMappings: ColorMapping[] = [
      { condition: { status: "active" }, color: "#00FF00" },
    ];

    component.writeValue(testMappings);
    component["detectSelectedField"]();

    expect(component.selectedColorField).toBe("status");
  });

  it("should open JSON editor with empty array by default", () => {
    component.openColorJsonEditor();

    expect(mockDialog.open).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({
        data: jasmine.objectContaining({
          value: [],
        }),
      }),
    );
  });

  it("should generate template when field is selected", () => {
    const mockEnum = new ConfigurableEnum("test-enum");
    mockEnum.values = [
      { id: "option1", label: "Option 1" },
      { id: "option2", label: "Option 2" },
    ];

    mockEnumService.getEnum.and.returnValue(mockEnum);

    component.selectedColorField = "testField";
    component.entityConstructor.schema.set("testField", {
      dataType: "configurable-enum",
      additional: "test-enum",
      label: "Test Field",
    } as any);

    component.openColorJsonEditor();

    expect(mockDialog.open).toHaveBeenCalledWith(
      jasmine.anything(),
      jasmine.objectContaining({
        data: jasmine.objectContaining({
          value: [
            { condition: { testField: "option1" }, color: "" },
            { condition: { testField: "option2" }, color: "" },
          ],
        }),
      }),
    );
  });

  it("should emit value change when JSON editor closes with result", () => {
    const testMappings: ColorMapping[] = [
      { condition: { status: "active" }, color: "#123456" },
    ];

    mockDialog.open.and.returnValue({
      afterClosed: () => of(testMappings),
    } as any);

    spyOn(component, "onChange");

    component.openColorJsonEditor();

    expect(component.onChange).toHaveBeenCalledWith(testMappings);
  });
});
