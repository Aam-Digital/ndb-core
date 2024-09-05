import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChildBlockComponent } from "./child-block.component";
import { ChildrenService } from "../children.service";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { FileService } from "../../../features/file/file.service";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";

describe("ChildBlockComponent", () => {
  let component: ChildBlockComponent;
  let fixture: ComponentFixture<ChildBlockComponent>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(waitForAsync(() => {
    mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
      "getChild",
    ]);
    mockChildrenService.getChild.and.resolveTo(createEntityOfType("Child"));

    TestBed.configureTestingModule({
      imports: [ChildBlockComponent, FontAwesomeTestingModule],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: FileService, useValue: undefined },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildBlockComponent);
    component = fixture.componentInstance;
    component.entity = createEntityOfType("Child");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
