import { delay, of } from "rxjs";
import { ExternalProfile } from "./external-profile";
import { faker } from "@faker-js/faker";

export const mockSkillApi = {
  getExternalProfiles: () =>
    of([createSkillApiDummyData("1"), createSkillApiDummyData("2")]).pipe(
      delay(faker.number.int({ min: 100, max: 900 })),
    ),

  getExternalProfilesForEntity: () =>
    of(
      faker.helpers.multiple(() => createSkillApiDummyData(""), {
        count: { min: 0, max: 3 },
      }),
    ).pipe(delay(faker.number.int({ min: 100, max: 900 }))),

  generateDefaultSearchParams: () => ({
    fullName: "John Doe",
  }),

  getExternalProfileById: (id: string) =>
    of(createSkillApiDummyData(id)).pipe(
      delay(faker.number.int({ min: 100, max: 900 })),
    ),
};

export function createSkillApiDummyData(externalId: string): ExternalProfile {
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
