import { fakeAsync, TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { environment } from "../../../../environments/environment.spec";
import { Role } from "./user-account";
import { UserAdminApiError } from "./user-admin.service";
import { Logging } from "app/core/logging/logging.service";

describe("KeycloakAdminService", () => {
  let service: KeycloakAdminService;
  let httpTestingController: HttpTestingController;

  const BASE_URL = `${environment.userAdminApi}/admin/realms/${environment.realm}`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [KeycloakAdminService],
    });

    service = TestBed.inject(KeycloakAdminService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should delete user", fakeAsync(() => {
    // when
    service.deleteUser("test-entity-id").subscribe((response) => {
      expect(response.userDeleted).toBeTrue();
    });

    // then
    const reqGet = httpTestingController.expectOne(
      `${BASE_URL}/users?q=exact_username:test-entity-id&exact=true`,
    );
    expect(reqGet.request.method).toEqual("GET");
    reqGet.flush([{ id: "test-id" }]);

    httpTestingController
      .expectOne(
        `http://localhost:8080/admin/realms/test-realm/users/test-id/role-mappings/realm`,
      )
      .flush([]);

    const reqDelete = httpTestingController.expectOne(
      `${BASE_URL}/users/test-id`,
    );
    expect(reqDelete.request.method).toEqual("DELETE");
    reqDelete.flush({});
  }));

  it("should create user", fakeAsync(() => {
    // given
    const mockUser = { id: "test-id", email: "test@example.com" };

    // when
    service
      .createUser("test-entity-id", "test@example.com", [])
      .subscribe((user) => {
        expect(user).toEqual(
          jasmine.objectContaining({ email: "test@example.com" }),
        );
      });

    // then
    const reqPost = httpTestingController.expectOne(`${BASE_URL}/users`);
    expect(reqPost.request.method).toEqual("POST");
    reqPost.flush(mockUser);

    httpTestingController
      .expectOne(
        (req) => req.url === `${BASE_URL}/users` && req.method === "GET",
      )
      .flush([mockUser]);

    httpTestingController
      .expectOne(
        (req) =>
          req.url === `${BASE_URL}/users/test-id/role-mappings/realm` &&
          req.method === "POST",
      )
      .flush({});

    httpTestingController
      .expectOne(
        (req) =>
          req.url ===
            `${BASE_URL}/users/${mockUser.id}/execute-actions-email` &&
          req.method === "PUT",
      )
      .flush({});
  }));

  it("should log warning if user does not exist in Keycloak during deletion", fakeAsync(() => {
    const warnSpy = spyOn(Logging, "warn");

    service.deleteUser("test-id").subscribe((response) => {
      expect(response.userDeleted).toBeTrue();
    });

    const reqGet = httpTestingController.expectOne(
      `${BASE_URL}/users?q=exact_username:test-id&exact=true`,
    );
    expect(reqGet.request.method).toBe("GET");

    reqGet.flush([]);

    expect(warnSpy).toHaveBeenCalledWith("User not found in Keycloak", {
      userEntityId: "test-id",
    });
  }));

  it("should throw well-defined error when created user's email already exists", fakeAsync(() => {
    // when
    service
      .createUser("test-entity-id", "test@example.com", [])
      // then
      .subscribe(
        () => fail("Expected error but completed unexpectedly"),
        (err) => {
          expect(err).toBeInstanceOf(UserAdminApiError);
          expect(err.status).toEqual(409);
          expect(err.message).toContain("email");
        },
      );

    const reqPost = httpTestingController.expectOne(`${BASE_URL}/users`);
    expect(reqPost.request.method).toEqual("POST");
    reqPost.flush(
      { errorMessage: "User exists with same email" },
      { status: 409, statusText: "Conflict" },
    );
  }));

  it("should update user and send email verification again", fakeAsync(() => {
    // given
    const mockUser = { id: "test-id", email: "test@example.com" };

    // when
    service
      .updateUser("test-id", { email: "new@example.com" })
      .subscribe((result) => {
        expect(result).toEqual({ userUpdated: true });
      });

    // then
    const reqGet = httpTestingController.expectOne(`${BASE_URL}/users/test-id`);
    expect(reqGet.request.method).toEqual("GET");
    reqGet.flush(mockUser);

    const reqPut = httpTestingController.expectOne(`${BASE_URL}/users/test-id`);
    expect(reqPut.request.method).toEqual("PUT");
    reqPut.flush({});

    httpTestingController
      .expectOne(
        (req) =>
          req.url ===
            `${BASE_URL}/users/${mockUser.id}/execute-actions-email` &&
          req.method === "PUT",
      )
      .flush({});
  }));

  it("should handle error when updating user", fakeAsync(() => {
    // when
    service
      .updateUser("test-id", { email: "new@example.com" })
      .subscribe((result) => {
        expect(result).toEqual({ userUpdated: false });
      });

    // then
    const reqGet = httpTestingController.expectOne(`${BASE_URL}/users/test-id`);
    expect(reqGet.request.method).toEqual("GET");
    reqGet.flush({ id: "test-id" });

    const reqPut = httpTestingController.expectOne(`${BASE_URL}/users/test-id`);
    expect(reqPut.request.method).toEqual("PUT");
    reqPut.flush(
      { message: "Failed to update user" },
      { status: 500, statusText: "Server Error" },
    );
  }));

  it("should get all roles and filter non-technical roles", fakeAsync(() => {
    // given
    const mockRoles: Role[] = [
      { id: "1", name: "admin" },
      { id: "2", name: "user" },
      { id: "3", name: "offline_access" }, // default role to be filtered out
    ];

    // when
    service.getAllRoles().subscribe((roles) => {
      expect(roles).toEqual([mockRoles[0], mockRoles[1]]);
    });

    // then
    const req = httpTestingController.expectOne(`${BASE_URL}/roles`);
    expect(req.request.method).toEqual("GET");
    req.flush(mockRoles);
  }));
});
