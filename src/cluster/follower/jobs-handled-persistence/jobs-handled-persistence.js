class JobsHandledPersistence {
    add(jobUuid) {}
    hasJob(jobUuid) {}
}

class JobsHandledPersistenceNaive extends JobsHandledPersistence {
    constructor() {
        this.jobsHandled = [];
    }

    add(jobUuid) {
        this.jobsHandled.push(jobUuid);
    }

    hasJob(jobUuid) {
        return this.jobsHandled.indexOf(jobUuid) > -1;
    }
}
