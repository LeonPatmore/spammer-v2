class JobsHandledPersistenceNaive {
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

module.exports = { JobsHandledPersistenceNaive };
