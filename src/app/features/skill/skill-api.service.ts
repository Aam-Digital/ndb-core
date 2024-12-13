import { inject, Injectable } from "@angular/core";
import { firstValueFrom, Observable } from "rxjs";
import { ExternalProfile } from "./external-profile";
import { Entity } from "app/core/entity/model/entity";
import { HttpClient } from "@angular/common/http";
import { map } from "rxjs/operators";
import { EscoApiService } from "./esco-api.service";
import { ExternalProfileLinkConfig } from "./link-external-profile/external-profile-link-config";
import { retryOnServerError } from "../../utils/retry-on-server-errror.rxjs-pipe";

/**
 * Interaction with Aam Digital backend providing access to external profiles
 * for skills integration.
 */
@Injectable()
export class SkillApiService {
  private readonly http = inject(HttpClient);
  private readonly escoApi = inject(EscoApiService);

  /**
   * Fetch possibly matching external profiles
   * from the API with the given search parameters.
   *
   * @param searchParams
   * @param page The pagination page (optional)
   */
  getExternalProfiles(
    searchParams: ExternalProfileSearchParams,
    page?: number,
  ): Observable<UserProfileResponseDto> {
    const params = {
      ...searchParams,
    };
    if (page) {
      params["page"] = page;
    }

    return this.http
      .get<UserProfileResponseDto>("/api/v1/skill/user-profile", {
        params,
      })
      .pipe(
        retryOnServerError(2),
        map((value) => value),
      );
  }

  /**
   * Generate default search parameters for the given entity.
   *
   * @param entity The entity for which to find matching external profiles
   * @param config The configuration for the external profile link field
   */
  generateDefaultSearchParams(
    entity: Entity,
    config: ExternalProfileLinkConfig,
  ): ExternalProfileSearchParams {
    return {
      fullName: (config?.searchFields.fullName ?? [])
        .map((field) => entity[field])
        .filter((value) => !!value)
        .join(" "),
      email: (config?.searchFields.email ?? [])
        .map((field) => entity[field])
        .filter((value) => !!value)
        .join(" "),
      phone: (config?.searchFields.phone ?? [])
        .map((field) => entity[field])
        .filter((value) => !!value)
        .join(" "),
    };
  }

  /**
   * Fetch an external profile by its ID from the API.
   * @param externalId
   */
  getExternalProfileById(externalId: string): Observable<ExternalProfile> {
    return this.http
      .get<ExternalProfile>("/api/v1/skill/user-profile/" + externalId)
      .pipe(retryOnServerError(2));
  }

  /**
   * Get entity IDs of skills for an external profile,
   * ensuring that these Skill entities exist in the database
   * and create them, if necessary.
   * @param externalId
   */
  async getSkillsFromExternalProfile(externalId: string): Promise<string[]> {
    const profile = await firstValueFrom(
      this.getExternalProfileById(externalId),
    );

    const skills: Entity[] = [];
    for (const extSkill of profile.skills) {
      const skill = await this.escoApi.loadOrCreateSkillEntity(
        extSkill.escoUri,
      );
      skills.push(skill);
    }

    return skills.map((s) => s.getId());
  }
}

export interface UserProfileResponseDto {
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
  };
  results: ExternalProfile[];
}

/**
 * Search parameters to find matching external profiles through the API.
 */
export interface ExternalProfileSearchParams {
  fullName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
}
