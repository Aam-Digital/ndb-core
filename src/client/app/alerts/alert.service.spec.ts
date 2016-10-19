import { AlertService } from './alert.service';
import { Alert } from './alert';

export function main() {
    describe('alert-service tests', () => {
        let alertService: AlertService;

        beforeEach(() => {
            alertService = new AlertService();
        });

        it('add info alert', function () {
            let message = 'info alert';
            alertService.addInfo(message);

            expect(alertService.alerts[0].message).toEqual(message);
            expect(alertService.alerts[0].type).toEqual('info');
        });

        it('add success alert', function () {
            let message = 'success alert';
            alertService.addSuccess(message);

            expect(alertService.alerts[0].message).toEqual(message);
            expect(alertService.alerts[0].type).toEqual('success');
        });

        it('add warning alert', function () {
            let message = 'warning alert';
            alertService.addWarning(message);

            expect(alertService.alerts[0].message).toEqual(message);
            expect(alertService.alerts[0].type).toEqual('warning');
        });

        it('add danger alert', function () {
            let message = 'danger alert';
            alertService.addDanger(message);

            expect(alertService.alerts[0].message).toEqual(message);
            expect(alertService.alerts[0].type).toEqual('danger');
        });

        it('removes alert', function () {
            let alert = new Alert('test message', Alert.DANGER);
            alertService.addAlert(alert);
            alertService.removeAlert(alert);

            expect(alertService.alerts.length).toBe(0);
        });
    });
}
