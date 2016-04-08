import {Injectable} from "angular2/core";

@Injectable()
export class ConfigService {

    version = "1.0.2";

    github = {
        user: "sebastian-leidig",
        repository: "helgo_db"
    };

    database = {
        name: "dev",
        remote_url: "http://demo-db.sinnfragen.org/db/",
        timeout: 60000,
        outdated_threshold_days: 0
    };

    analytics = {
        enabled: false,
        piwik_url: "http://piwik.sinnfragen.org/",
        site_id: 4
    };

}
