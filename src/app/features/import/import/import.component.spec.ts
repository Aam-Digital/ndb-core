import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ImportComponent } from "./import.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ImportModule } from "../import.module";

describe("ImportComponent", () => {
  let component: ImportComponent;
  let fixture: ComponentFixture<ImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportModule, MockedTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
