import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface EscoSkillResponseDto {
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

@Injectable({
  providedIn: "root",
})
export class EscoApiService {
  private readonly http: HttpClient = inject(HttpClient);

  getEscoSkill(uri: string): Observable<EscoSkillDto> {
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
        map((value) => {
          let dto: EscoSkillDto | undefined = value._embedded[uri];

          if (dto == undefined) {
            throw new Error("Skill not found");
          }

          return dto;
        }),
      );
  }
}
