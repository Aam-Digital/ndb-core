import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ReadonlyFunctionComponent } from "./readonly-function.component";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("ReadonlyFunctionComponent", () => {
  let component: ReadonlyFunctionComponent;
  let fixture: ComponentFixture<ReadonlyFunctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReadonlyFunctionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ReadonlyFunctionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("entity", TestEntity.create("nameBefore"));
    fixture.componentRef.setInput("config", (entity) => entity.toString());
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
