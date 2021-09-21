import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FaDynamicIconComponent } from "./fa-dynamic-icon.component";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { faCoffee, faHome } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("FaDynamicIconComponent", () => {
  let component: FaDynamicIconComponent;
  let fixture: ComponentFixture<FaDynamicIconComponent>;
  let mockIconLibrary: jasmine.SpyObj<FaIconLibrary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FontAwesomeTestingModule],
      declarations: [FaDynamicIconComponent],
      providers: [{ provide: FaIconLibrary, useValue: mockIconLibrary }],
    }).compileComponents();
    mockIconLibrary = jasmine.createSpyObj<FaIconLibrary>([
      "getIconDefinition",
    ]);
    mockIconLibrary.getIconDefinition.and.callFake((_, prefix) => {
      if (prefix === "coffee") {
        return faCoffee;
      } else {
        return undefined;
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FaDynamicIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the correct icon when it is in the map", () => {
    component.icon = "home";
    expect(component._icon).toEqual(faHome);
  });

  it("should show the registered icon when it is not in the map but exists as icon definition", () => {
    component.icon = "coffee";
    expect(component._icon).toEqual(faCoffee);
  });

  it("should show the fallback icon when it is neither in the map nor exists as icon definition", () => {
    component.icon = "I do not exist";
    expect(component._icon).toEqual(FaDynamicIconComponent.fallbackIcon);
  });
});
