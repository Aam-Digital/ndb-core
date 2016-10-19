import { Injectable } from '@angular/core';

@Injectable()
export class ConfigService {

    version = '2.0.0';

    database = {
        name: 'dev',
        remote_url: 'http://demo-db.sinnfragen.org/db/',
        timeout: 60000,
        outdated_threshold_days: 0
    };

    analytics = {
        enabled: false,
        piwik_url: 'http://piwik.sinnfragen.org/',
        site_id: 4
    };

}
