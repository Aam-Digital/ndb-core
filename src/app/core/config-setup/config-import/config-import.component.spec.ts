import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfigImportComponent } from "./config-import.component";
import { ConfigImportParserService } from "../config-import-parser.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { ConfigSetupModule } from "../config-setup.module";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";

describe("ConfigImportComponent", () => {
  let component: ConfigImportComponent;
  let fixture: ComponentFixture<ConfigImportComponent>;

  const mockConfigParser: ConfigImportParserService = jasmine.createSpyObj([
    "parseImportDefinition",
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConfigSetupModule,
        FontAwesomeTestingModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ConfigImportParserService, useValue: mockConfigParser },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
