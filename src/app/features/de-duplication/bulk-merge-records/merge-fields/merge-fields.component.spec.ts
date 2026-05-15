import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { MergeFieldsComponent } from "./merge-fields.component";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("MergeFieldsComponent", () => {
  let component: MergeFieldsComponent;
  let fixture: ComponentFixture<MergeFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MergeFieldsComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(MergeFieldsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("field", {
      id: "name",
      dataType: "string",
    });
    fixture.componentRef.setInput("entities", [
      TestEntity.create("Entity A"),
      TestEntity.create("Entity B"),
    ]);
    fixture.componentRef.setInput("control", new FormControl());
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
