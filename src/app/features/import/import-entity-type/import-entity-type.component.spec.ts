import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportEntityTypeComponent } from "./import-entity-type.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ImportModule } from "../import.module";

describe("ImportSelectTypeComponent", () => {
  let component: ImportEntityTypeComponent;
  let fixture: ComponentFixture<ImportEntityTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportModule, MockedTestingModule],
      declarations: [ImportEntityTypeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportEntityTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
