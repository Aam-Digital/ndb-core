import { ComponentFixture, TestBed } from "@angular/core/testing";

import { GotoThirdPartySystemComponent } from "./goto-third-party-system.component";
import { ThirdPartyAuthenticationService } from "../third-party-authentication.service";

describe("GotoThirdPartySystemComponent", () => {
  let component: GotoThirdPartySystemComponent;
  let fixture: ComponentFixture<GotoThirdPartySystemComponent>;

  let mockTPAService: jasmine.SpyObj<ThirdPartyAuthenticationService>;

  beforeEach(async () => {
    mockTPAService = jasmine.createSpyObj<ThirdPartyAuthenticationService>([
      "getSessionId",
      "getRedirectUrl",
    ]);

    await TestBed.configureTestingModule({
      imports: [GotoThirdPartySystemComponent],
      providers: [
        { provide: ThirdPartyAuthenticationService, useValue: mockTPAService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GotoThirdPartySystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
