import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";
import { Skill } from "./skill";
import { retryOnServerError } from "../../utils/retry-on-server-errror.rxjs-pipe";

export interface EscoSkillResponseDto {
  count: number;
  language: string;
  _embedded: Map<string, EscoSkillDto>;
}

export interface EscoSkillDto {
  className: string;
  classId: string;
  uri: string;
  title: string;
  referenceLanguage: string[];
  preferredLabel: { [key: string]: string[] };
  alternativeLabel: { [key: string]: string[] };
  description: {
    [key: string]: {
      literal: string;
      mimetype: string;
    };
  };
  status: string;
}

/**
 * Fetch Skill descriptions from the public API
 * of the European Skills, Competences, Qualifications and Occupations (ESCO) database.
 *
 * see https://esco.ec.europa.eu/en/classification
 */
@Injectable({
  providedIn: "root",
})
export class EscoApiService {
  private readonly http = inject(HttpClient);
  private readonly entityMapper = inject(EntityMapperService);

  /**
   * Fetch a skill from the API.
   * @param uri The ESCO URI of the skill
   * @returns The ESCO API response (not parsed to a "Skill" entity)
   */
  fetchSkill(uri: string): Observable<EscoSkillDto> {
    return this.http
      .get<EscoSkillResponseDto>(
        "https://ec.europa.eu/esco/api/resource/skill",
        {
          params: {
            uris: uri,
          },
        },
      )
      .pipe(
        retryOnServerError(3),
        map((value) => {
          let dto: EscoSkillDto | undefined = value?._embedded?.[uri];
          if (dto == undefined) {
            throw new Error("Skill not found");
          }
          return dto;
        }),
      );
  }

  /**
   * Load a Skill entity from the database
   * or fetch it from the public API and create as new entity if it doesn't exist yet.
   *
   * @param uri The ESCO URI of the skill
   * @returns The Skill entity (which is also ensured to be present in the database now)
   */
  async loadOrCreateSkillEntity(uri: string): Promise<Skill> {
    let entity: Skill | undefined = await this.entityMapper
      .load(Skill, uri)
      .catch((e) => {
        if (e.status === 404) {
          return undefined;
        } else {
          throw e;
        }
      });

    if (!entity) {
      let escoDto: EscoSkillDto = await firstValueFrom(this.fetchSkill(uri));
      entity = Skill.create(
        uri,
        escoDto.title,
        escoDto.description["en"].literal, // todo use current language and fallback to en
      );
      await this.entityMapper.save(entity);
    }

    return entity;
  }
}
