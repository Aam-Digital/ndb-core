import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChildBlockComponent } from "./child-block.component";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ChildBlockComponent", () => {
  let component: ChildBlockComponent;
  let fixture: ComponentFixture<ChildBlockComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
      "getChild",
    ]);
    mockChildrenService.getChild.and.resolveTo(new Child(""));

    TestBed.configureTestingModule({
      imports: [ChildBlockComponent, FontAwesomeTestingModule],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  }));

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
