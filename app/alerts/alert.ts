export class Alert {
    static SUCCESS = 'success';
    static INFO = 'info';
    static WARNING = 'warning';
    static DANGER = 'danger';

    constructor(
        public message: string,
        public type: string
    ) {}
}
