import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ConfigImportComponent } from "./config-import.component";
import { ConfigImportParserService } from "../config-import-parser.service";

describe("ConfigImportComponent", () => {
  let component: ConfigImportComponent;
  let fixture: ComponentFixture<ConfigImportComponent>;

  const mockConfigParser: ConfigImportParserService = jasmine.createSpyObj([
    "parseImportDefinition",
  ]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigImportComponent],
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
