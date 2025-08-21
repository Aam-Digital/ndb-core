import { TestBed } from "@angular/core/testing";

import { EmailClientService } from "./email-client.service";
import {
  entityRegistry,
  EntityRegistry,
} from "#src/app/core/entity/database-entity.decorator";

describe("EmailClientService", () => {
  let service: EmailClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: EntityRegistry, useValue: entityRegistry }],
    });
    service = TestBed.inject(EmailClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
