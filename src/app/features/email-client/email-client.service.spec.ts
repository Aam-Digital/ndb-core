import { TestBed } from "@angular/core/testing";

import { EmailClientService } from "./email-client.service";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { Entity } from "#src/app/core/entity/model/entity";
import { EmailDatatype } from "#src/app/core/basic-datatypes/string/email.datatype";
import { SyncStateSubject } from "#src/app/core/session/session-type";
import { EntityMapperService } from "#src/app/core/entity/entity-mapper/entity-mapper.service";
import { createEntityMapperSpyObj } from "#src/app/core/entity/entity-mapper/mock-entity-mapper-service";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";

fdescribe("EmailClientService", () => {
  let service: EmailClientService;
  let mockRegistry: jasmine.SpyObj<EntityRegistry>;
  let mockAlert: jasmine.SpyObj<AlertService>;

  beforeEach(() => {
    mockRegistry = jasmine.createSpyObj("EntityRegistry", ["get"]);
    mockAlert = jasmine.createSpyObj("AlertService", ["addWarning"]);

    TestBed.configureTestingModule({
      providers: [
        EmailClientService,
        { provide: EntityRegistry, useValue: mockRegistry },
        { provide: AlertService, useValue: mockAlert },
        {
          provide: EntityMapperService,
          useValue: jasmine.createSpyObj(["load", "save"]),
        },
      ],
    });

    service = TestBed.inject(EmailClientService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should show warning and return false if email field exists but value is missing", async () => {
    const fakeEntity = {
      getType: () => "TestEntity",
      email: undefined,
    } as unknown as Entity;
    const FakeEntityConstructor: any = {
      schema: [{ id: "email", dataType: EmailDatatype.dataType }],
    };
    mockRegistry.get.and.returnValue(FakeEntityConstructor);

    const result = await service.executeMailto(fakeEntity);

    expect(result).toBeFalse();
    expect(mockAlert.addWarning).toHaveBeenCalledWith(
      "Please fill an email address for this record to use this functionality.",
    );
  });
});
