import { Injectable } from "@angular/core";
import { delay, Observable, of } from "rxjs";
import { ExternalProfile } from "./external-profile";

/**
 * Interaction with Aam Digital backend providing skills integration functionality.
 */
@Injectable({
  providedIn: "root",
})
export class SkillApiService {
  constructor() {}

  getExternalProfiles(forObject?: Object): Observable<ExternalProfile[]> {
    const requestParams = {};
    if (forObject?.["name"]) requestParams["fullName"] = forObject["name"];
    if (forObject?.["email"]) requestParams["email"] = forObject["email"];
    if (forObject?.["phone"]) requestParams["phone"] = forObject["phone"];

    let mockResults = [];
    for (let i = 1; i <= forObject?.["externalProfileMockResults"] ?? 2; i++) {
      mockResults.push(createDummyData(i.toString()));
    }
    // TODO: implement actual API call and replace dummy data
    return of(mockResults).pipe(delay(2000));
  }

  getExternalProfileById(externalId: string): Observable<ExternalProfile> {
    // TODO: implement actual API call and replace dummy data
    return of(createDummyData(externalId)).pipe(delay(1000));
  }
}

function createDummyData(externalId: string): ExternalProfile {
  return {
    id: externalId,
    fullName: "John Doe " + externalId,
    phone: "+1234567890",
    email: "john@example.com",
    skills: ["foo", "bar"],
    importedAt: "2021-01-01T00:00:00Z",
    latestSyncAt: "2021-01-01T00:00:00Z",
    updatedAtExternalSystem: "2021-01-01T00:00:00Z",
  };
}
