import { inject, Injectable } from "@angular/core";
import { firstValueFrom, Observable } from "rxjs";
import { ExternalProfile, ExternalSkill } from "./external-profile";
import { Entity } from "../../../core/entity/model/entity";
import { HttpClient } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
import { EscoApiService } from "../esco-api/esco-api.service";
import { ExternalProfileLinkConfig } from "../external-profile-link-config";
import { retryOnServerError } from "../../../utils/retry-on-server-error.rxjs-pipe";
import { FormGroup } from "@angular/forms";
import { Logging } from "../../../core/logging/logging.service";
import { AlertService } from "../../../core/alerts/alert.service";

/**
 * Interaction with Aam Digital backend providing access to external profiles
 * for skills integration.
 */
@Injectable()
export class SkillApiService {
  private readonly http = inject(HttpClient);
  private readonly escoApi = inject(EscoApiService);
  private readonly alertService = inject(AlertService);

  private readonly BASE_URL = "/api/v1/skill/";

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
  ): Observable<ExternalProfileResponseDto> {
    const params = {
      ...searchParams,
    };
    if (page) {
      params["page"] = page;
    }

    return this.http
      .get<ExternalProfileResponseDto>(this.BASE_URL + "user-profile", {
        params,
      })
      .pipe(
        retryOnServerError(2),
        map((value) => value),
        catchError((e) => {
          if (e.status === 403) {
            e.message = $localize`:external profile matching dialog:Your user account does not have permission to access external profiles.`;
          }
          throw e;
        }),
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
      .get<ExternalProfile>(this.BASE_URL + "user-profile/" + externalId)
      .pipe(retryOnServerError(2));
  }

  /**
   * Load configured data fields from the external profile and apply
   * to the target entity.
   * In case of errors or unavailability, the target fields are set to undefined.
   *
   * @param externalProfile The external profile or its ID to get the skills for. If undefined, the target fields are set to undefined.
   * @param config The configuration for the external profile linking
   * @param target The target entity or form group to apply the data to
   */
  async applyDataFromExternalProfile(
    externalProfile: ExternalProfile | string | undefined,
    config: ExternalProfileLinkConfig,
    target: Entity | FormGroup,
  ): Promise<void> {
    const messageFailedToLoad =
      $localize`:import data from linked external profile:Could not load data from external profile` +
      (target instanceof Entity ? '("' + target.toString() + '")' : "");

    const sourceProfile: Object =
      typeof externalProfile === "string"
        ? await firstValueFrom(
            this.getExternalProfileById(externalProfile),
          ).catch((e) => {
            Logging.warn(
              "SkillApiService error getting external profile for applying data",
              e,
            );
            this.alertService.addWarning(messageFailedToLoad);
            return {};
          })
        : (externalProfile ?? {});

    for (const { from, to, transformation } of config.applyData) {
      let value = sourceProfile[from];

      try {
        switch (transformation) {
          case "escoSkill":
            value = await this.transformationToEscoSkills(value);
        }
      } catch (e) {
        Logging.warn(
          "SkillApiService error transforming data to be applied",
          e,
        );
        this.alertService.addWarning(messageFailedToLoad);
        value = undefined;
      }

      if (target instanceof Entity) {
        target[to] = value;
      } else if (target instanceof FormGroup) {
        const targetFormControl = target.get(to);
        if (targetFormControl) {
          targetFormControl?.setValue(value);
          targetFormControl?.markAsDirty();
        } else {
          Logging.warn(
            "SkillAPI: Could not find form control to apply data to field",
            to,
          );
        }
      } else {
        Logging.warn(
          "SkillAPI: target is not a valid type to apply data to",
          target,
        );
      }
    }
  }

  /**
   * Transform the given value to a list of ESCO skill entities and return their IDs.
   * @param value
   */
  private async transformationToEscoSkills(
    value: ExternalSkill[],
  ): Promise<string[] | undefined> {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const skills: Entity[] = [];
    for (const extSkill of value) {
      const skill = await this.escoApi.loadOrCreateSkillEntity(
        extSkill.escoUri,
      );
      skills.push(skill);
    }

    return skills.map((s) => s.getId());
  }
}

/**
 * Response payload returned for external profiles request from the API.
 */
export interface ExternalProfileResponseDto<T = ExternalProfile> {
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
  };
  results: T[];
}

/**
 * Search parameters to find matching external profiles through the API.
 */
export interface ExternalProfileSearchParams {
  fullName?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
}
