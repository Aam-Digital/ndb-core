import { TestBed } from "@angular/core/testing";

import { TemplateExportContextService } from "./template-export-context.service";
import { CurrentUserSubject } from "../../../core/session/current-user-subject";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("TemplateExportContextService", () => {
  let service: TemplateExportContextService;
  let currentUser: CurrentUserSubject;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CurrentUserSubject],
    });
    service = TestBed.inject(TemplateExportContextService);
    currentUser = TestBed.inject(CurrentUserSubject);
  });

  it("should provide the entity of the logged-in user as context", () => {
    const userEntity = new TestEntity("user-1");
    userEntity.name = "Test User";
    currentUser.next(userEntity);

    expect(service.getComplement()).toEqual({ user: userEntity });
  });

  it("should not provide any context if the user account has no linked entity", () => {
    currentUser.next(null);

    expect(service.getComplement()).toBeUndefined();
  });

  it("should not provide any context if no user is logged in", () => {
    // CurrentUserSubject holds `undefined` until a session is established
    expect(service.getComplement()).toBeUndefined();
  });
});
