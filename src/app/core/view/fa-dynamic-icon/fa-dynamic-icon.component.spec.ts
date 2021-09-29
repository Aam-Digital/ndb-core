import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FaDynamicIconComponent } from "./fa-dynamic-icon.component";
import {
  FaIconLibrary,
  FontAwesomeModule,
} from "@fortawesome/angular-fontawesome";
import {
  faCoffee,
  faHome,
  faQuestion,
} from "@fortawesome/free-solid-svg-icons";
import { LoggingService } from "../../logging/logging.service";
import { faAddressBook } from "@fortawesome/free-regular-svg-icons";

describe("FaDynamicIconComponent", () => {
  let component: FaDynamicIconComponent;
  let fixture: ComponentFixture<FaDynamicIconComponent>;
  let mockIconLibrary: jasmine.SpyObj<FaIconLibrary>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;

  beforeEach(async () => {
    mockIconLibrary = jasmine.createSpyObj<FaIconLibrary>([
      "getIconDefinition",
    ]);
    mockLoggingService = jasmine.createSpyObj(["warn"]);
    mockIconLibrary.getIconDefinition.and.callFake((prefix, icon) => {
      if (icon === "coffee") {
        return faCoffee;
      } else {
        return undefined;
      }
    });
    await TestBed.configureTestingModule({
      declarations: [FaDynamicIconComponent],
      imports: [FontAwesomeModule],
      providers: [
        { provide: FaIconLibrary, useValue: mockIconLibrary },
        { provide: LoggingService, useValue: mockLoggingService },
      ],
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
    component.icon = "home";
    expect(component._icon).toEqual(faHome);
  });

  it("should show the registered icon when it is not in the map but exists as icon definition", () => {
    component.icon = "coffee";
    expect(component._icon).toEqual(faCoffee);
  });

  it("should show the fallback icon and warn when it is neither in the map nor exists as icon definition", () => {
    component.icon = "I do not exist";
    expect(component._icon).toEqual(FaDynamicIconComponent.fallbackIcon);
    expect(mockLoggingService.warn).toHaveBeenCalled();
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
