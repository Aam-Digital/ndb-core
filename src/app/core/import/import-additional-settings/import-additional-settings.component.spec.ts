import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ImportAdditionalSettingsComponent } from "./import-additional-settings.component";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ImportAdditionalSettingsComponent", () => {
  let component: ImportAdditionalSettingsComponent;
  let fixture: ComponentFixture<ImportAdditionalSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ImportAdditionalSettingsComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportAdditionalSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should have comma as default separator", () => {
    expect(component.multiValueSeparator).toBe(",");
  });

  it("should update settings when separator changes", () => {
    component.multiValueSeparator = ";";

    expect(component.settings().multiValueSeparator).toBe(";");
  });

  it("should allow custom separator via createCustomSeparator", async () => {
    const customSeparator = "|";

    const result = await component.createCustomSeparator(customSeparator);

    expect(result).toBe(customSeparator);
  });
});
