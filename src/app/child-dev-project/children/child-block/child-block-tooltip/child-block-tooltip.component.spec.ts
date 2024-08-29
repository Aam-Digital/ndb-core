import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ChildBlockTooltipComponent } from "./child-block-tooltip.component";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FileService } from "../../../../features/file/file.service";
import { createEntityOfType } from "../../../../core/demo-data/create-entity-of-type";

describe("ChildBlockTooltipComponent", () => {
  let component: ChildBlockTooltipComponent;
  let fixture: ComponentFixture<ChildBlockTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChildBlockTooltipComponent, FontAwesomeTestingModule],
      providers: [{ provide: FileService, useValue: {} }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildBlockTooltipComponent);
    component = fixture.componentInstance;
    component.entity = createEntityOfType("Child");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
