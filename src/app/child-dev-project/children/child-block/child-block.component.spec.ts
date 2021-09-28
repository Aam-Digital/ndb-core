import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChildBlockComponent } from "./child-block.component";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { SchoolBlockComponent } from "../../schools/school-block/school-block.component";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";

describe("ChildBlockComponent", () => {
  let component: ChildBlockComponent;
  let fixture: ComponentFixture<ChildBlockComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(
    waitForAsync(() => {
      mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
        "getChild",
      ]);
      mockChildrenService.getChild.and.returnValue(of(new Child("")));

      TestBed.configureTestingModule({
        declarations: [SchoolBlockComponent, ChildBlockComponent],
        imports: [RouterTestingModule],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildBlockComponent);
    component = fixture.componentInstance;
    component.entity = new Child("");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
