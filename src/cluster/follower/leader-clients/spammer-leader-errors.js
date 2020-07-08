class UuidAlreadyConnectedToLeaderError extends Error {
    constructor(uuid) {
        super(`UUID ${uuid} is already connected to the spammer leader!`);
    }
}

module.exports = UuidAlreadyConnectedToLeaderError;
