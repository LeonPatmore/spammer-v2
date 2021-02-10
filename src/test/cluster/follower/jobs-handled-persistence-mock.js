class JobsHandledPersistenceMock {
    constructor() {
        this.hasJob = jest.fn();
        this.add = jest.fn;
    }
}

module.exports = JobsHandledPersistenceMock;
