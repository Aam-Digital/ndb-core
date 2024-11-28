import { inject, Injectable } from "@angular/core";
import { firstValueFrom, Observable } from "rxjs";
import { ExternalProfile } from "./external-profile";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "app/core/entity/model/entity";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";

interface UserProfileResponseDto {
  result: ExternalProfile[];
}

/**
 * Interaction with Aam Digital backend providing skills integration functionality.
 */
@Injectable({
  providedIn: "root",
})
export class SkillApiService {
  private entityMapper: EntityMapperService = inject(EntityMapperService);
  private entityRegistry: EntityRegistry = inject(EntityRegistry);
  private http: HttpClient = inject(HttpClient);

  getExternalProfiles(forObject?: Object): Observable<ExternalProfile[]> {
    const requestParams = {};
    if (forObject?.["name"]) requestParams["fullName"] = forObject["name"];
    if (forObject?.["email"]) requestParams["email"] = forObject["email"];
    if (forObject?.["phone"]) requestParams["phone"] = forObject["phone"];

    return this.http
      .get<UserProfileResponseDto>("/api/v1/skill/user-profile", {
        params: requestParams,
      })
      .pipe(map((value) => value.result));
  }

  getExternalProfileById(externalId: string): Observable<ExternalProfile> {
    return this.http.get<ExternalProfile>(
      "/api/v1/skill/user-profile/" + externalId,
    );
  }

  async getSkillsFromExternalProfile(externalId: string): Promise<string[]> {
    const profile = await firstValueFrom(
      this.getExternalProfileById(externalId),
    );

    const skills: Entity[] = [];
    for (const extSkill of profile.skills) {
      const skill = await this.loadOrCreateSkill(extSkill.escoUri);
      skills.push(skill);
    }

    return skills.map((s) => s.getId());
  }

  private async loadOrCreateSkill(escoUri: string): Promise<Entity> {
    let entity = await this.entityMapper.load("Skill", escoUri).catch((e) => {
      if (e.status === 404) {
        return undefined;
      } else {
        throw e;
      }
    });

    if (!entity) {
      const ctor = this.entityRegistry.get("Skill");
      // TODO: load actual esco skill details from API
      entity = Object.assign(new ctor(escoUri), {
        escoUri: escoUri,
        name: "ESCO_NAME " + escoUri,
        description: "Lorem Ipsum",
      });
      await this.entityMapper.save(entity);
    }

    return entity;
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
