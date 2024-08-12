import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FaDynamicIconComponent } from "./fa-dynamic-icon.component";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import {
  faCoffee,
  faFileAlt,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { Logging } from "../../logging/logging.service";
import { faAddressBook } from "@fortawesome/free-regular-svg-icons";

describe("FaDynamicIconComponent", () => {
  let component: FaDynamicIconComponent;
  let fixture: ComponentFixture<FaDynamicIconComponent>;
  let mockIconLibrary: jasmine.SpyObj<FaIconLibrary>;

  beforeEach(async () => {
    mockIconLibrary = jasmine.createSpyObj<FaIconLibrary>([
      "getIconDefinition",
    ]);
    mockIconLibrary.getIconDefinition.and.callFake((prefix, icon) => {
      if (icon === "coffee") {
        return faCoffee;
      } else {
        return undefined;
      }
    });
    await TestBed.configureTestingModule({
      imports: [FaDynamicIconComponent],
      providers: [{ provide: FaIconLibrary, useValue: mockIconLibrary }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FaDynamicIconComponent);
    component = fixture.componentInstance;
    component._icon = faQuestion;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the correct icon when it is in the map", () => {
    component.icon = "file-text";
    expect(component._icon).toEqual(faFileAlt);
  });

  it("should show the registered icon when it is not in the map but exists as icon definition", () => {
    component.icon = "coffee";
    expect(component._icon).toEqual(faCoffee);
  });

  it("should show the fallback icon and warn when it is neither in the map nor exists as icon definition", () => {
    spyOn(Logging, "warn");
    component.icon = "I do not exist";
    expect(component._icon).toEqual(FaDynamicIconComponent.fallbackIcon);
    expect(Logging.warn).toHaveBeenCalled();
  });

  it("should set an icon if a different prefix is specified", () => {
    mockIconLibrary.getIconDefinition.and.callFake((prefix, name) => {
      if (prefix === "far" && name === "address-book") {
        return faAddressBook;
      } else {
        return undefined;
      }
    });
    component.icon = "far address-book";
    expect(component._icon).toEqual(faAddressBook);
  });
});
