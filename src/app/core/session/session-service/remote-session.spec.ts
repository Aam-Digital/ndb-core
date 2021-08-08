import { TestBed } from "@angular/core/testing";
import { RemoteSession } from "./remote-session";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { ConnectionState } from "../session-states/connection-state.enum";
import { of, throwError } from "rxjs";
import { AppConfig } from "../../app-config/app-config";
import { SessionType } from "../session-type";

describe("RemoteSessionService", () => {
  let service: RemoteSession;
  let mockHttpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    AppConfig.settings = {
      site_name: "test",
      session_type: SessionType.mock,
      database: {
        name: "database",
        remote_url: "database_url",
      },
    };
    mockHttpClient = jasmine.createSpyObj(["post", "delete"]);
    TestBed.configureTestingModule({
      providers: [
        RemoteSession,
        { provide: HttpClient, useValue: mockHttpClient },
      ],
    });
    service = TestBed.inject(RemoteSession);
  });

  it("should be connected after successful login", async () => {
    expect(service.connectionState.getState()).toBe(
      ConnectionState.DISCONNECTED
    );

    mockHttpClient.post.and.returnValue(of({}));

    await service.login("", "");

    expect(mockHttpClient.post).toHaveBeenCalled();
    expect(service.connectionState.getState()).toBe(ConnectionState.CONNECTED);
  });

  it("should be offline if login fails", async () => {
    mockHttpClient.post.and.returnValue(throwError(new Error()));

    await service.login("", "");

    expect(service.connectionState.getState()).toBe(ConnectionState.OFFLINE);
  });

  it("should be rejected if login is unauthorized", async () => {
    const unauthorizedError = new HttpErrorResponse({
      statusText: "Unauthorized",
    });
    mockHttpClient.post.and.returnValue(throwError(unauthorizedError));

    await service.login("", "");

    expect(service.connectionState.getState()).toBe(ConnectionState.REJECTED);
  });

  it("should disconnect after logout", async () => {
    service.connectionState.setState(ConnectionState.CONNECTED);
    mockHttpClient.delete.and.returnValue(of());

    await service.logout();

    expect(service.connectionState.getState()).toBe(
      ConnectionState.DISCONNECTED
    );
  });

  it("should assign the current user after successful login", async () => {
    mockHttpClient.post.and.returnValue(
      of({ name: "username", roles: ["user_app"] })
    );

    await service.login("", "");

    expect(service.getCurrentUser()).toEqual({
      name: "username",
      roles: ["user_app"],
    });
  });
});
