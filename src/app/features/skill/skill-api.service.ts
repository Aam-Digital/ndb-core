import { Injectable } from "@angular/core";
import { delay, firstValueFrom, Observable, of } from "rxjs";
import { ExternalProfile } from "./external-profile";

/**
 * Interaction with Aam Digital backend providing skills integration functionality.
 */
@Injectable({
  providedIn: "root",
})
export class SkillApiService {
  getExternalProfiles(forObject?: Object): Observable<ExternalProfile[]> {
    const requestParams = {};
    if (forObject?.["name"]) requestParams["fullName"] = forObject["name"];
    if (forObject?.["email"]) requestParams["email"] = forObject["email"];
    if (forObject?.["phone"]) requestParams["phone"] = forObject["phone"];

    let mockResults = [];
    const mockCount =
      typeof forObject?.["externalProfileMockResults"] === "number"
        ? forObject?.["externalProfileMockResults"]
        : 2;
    for (let i = 1; i <= mockCount; i++) {
      mockResults.push(createDummyData(i.toString()));
    }
    // TODO: implement actual API call and replace dummy data
    return of(mockResults).pipe(delay(2000));
  }

  getExternalProfileById(externalId: string): Observable<ExternalProfile> {
    // TODO: implement actual API call and replace dummy data
    return of(createDummyData(externalId)).pipe(delay(1000));
  }

  async getSkillsFromExternalProfile<S>(externalId: string): Promise<S> {
    const profile = await firstValueFrom(
      this.getExternalProfileById(externalId),
    );
    // TODO: map skills including loading of ESCO details?
    return JSON.stringify(profile.skills) as S;
  }
}

function createDummyData(externalId: string): ExternalProfile {
  return {
    id: externalId,
    fullName: "John Doe " + externalId,
    phone: "+1234567890",
    email: "john@example.com",
    skills: [
      {
        escoUri:
          "http://data.europa.eu/esco/skill/0ac31705-79ff-4409-a818-c9d0a6388e84",
        usage: "ALWAYS",
      },
      {
        escoUri:
          "http://data.europa.eu/esco/skill/2e040fb0-66b9-4529-bec6-466472b60773",
        usage: "OFTEN",
      },
    ],
    importedAt: "2021-01-01T00:00:00Z",
    latestSyncAt: "2021-01-01T00:00:00Z",
    updatedAtExternalSystem: "2021-01-01T00:00:00Z",
  };
}
