import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { AserComponent } from "./aser.component";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";
import { of } from "rxjs";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("AserComponent", () => {
  let component: AserComponent;
  let fixture: ComponentFixture<AserComponent>;

  const mockChildrenService = {
    getChild: () => {
      return of([new Child("22")]);
    },
    getAserResultsOfChild: () => {
      return of([]);
    },
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AserComponent, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AserComponent);
    component = fixture.componentInstance;
    component.entity = new Child("22");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
