import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { By } from "@angular/platform-browser";
import { ChildSchoolRelation } from "app/child-dev-project/children/model/childSchoolRelation";
import { EntityFunctionPipe } from "../readonly-function/entity-function.pipe";
import { ReadonlyFunctionComponent } from "../readonly-function/readonly-function.component";
import { ColoredReadonlyFunctionComponent } from "./colored-readonly-function.component";

describe("ColoredReadonlyFunctionComponent", () => {
  let component: ColoredReadonlyFunctionComponent;
  let fixture: ComponentFixture<ColoredReadonlyFunctionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ColoredReadonlyFunctionComponent,
        ReadonlyFunctionComponent,
        EntityFunctionPipe,
      ],
      imports: [MatChipsModule, MatTooltipModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ColoredReadonlyFunctionComponent);
    component = fixture.componentInstance;
    component.entity = new ChildSchoolRelation();
    component.displayFunction = () => undefined;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display the background color of the entity", () => {
    const colorCode = "rgba(144, 238, 144, 0.25)";
    const testEntity = new ChildSchoolRelation();
    spyOn(testEntity, "getColor").and.returnValue(colorCode);
    component.entity = testEntity;

    fixture.detectChanges();

    const chip = fixture.debugElement.query(By.css("mat-chip")).nativeElement;
    expect(chip.style.backgroundColor).toBe(colorCode);
  });
});
