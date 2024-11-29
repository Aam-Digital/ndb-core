import { inject, Injectable } from "@angular/core";
import { firstValueFrom, Observable } from "rxjs";
import { ExternalProfile } from "./external-profile";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { Entity } from "app/core/entity/model/entity";
import { EntityRegistry } from "../../core/entity/database-entity.decorator";
import { HttpClient } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { Logging } from "../../core/logging/logging.service";
import { EscoApiService, EscoSkillDto } from "./esco-api.service";

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
  private escoApi: EscoApiService = inject(EscoApiService);
  private http: HttpClient = inject(HttpClient);

  getExternalProfiles(
    searchName?: string,
    searchEmail?: string,
    searchPhone?: string,
  ): Observable<ExternalProfile[]> {
    const requestParams = {};
    if (searchName) requestParams["fullName"] = searchName;
    if (searchEmail) requestParams["email"] = searchEmail;
    if (searchPhone) requestParams["phone"] = searchPhone;

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
      let escoDto: EscoSkillDto = await firstValueFrom(
        this.escoApi.getEscoSkill(escoUri).pipe(
          catchError((err, caught) => {
            Logging.error(err);
            // todo error handling?
            return caught;
          }),
        ),
      );

      const ctor = this.entityRegistry.get("Skill");
      // TODO: load actual esco skill details from API
      entity = Object.assign(new ctor(escoUri), {
        escoUri: escoUri,
        name: escoDto.title,
        description: escoDto.description["en"].literal, // todo use current language and fallback to en
      });
      await this.entityMapper.save(entity);
    }

    return entity;
  }
}
