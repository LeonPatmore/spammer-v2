const httpStatus = require('http-status-codes');

class HttpAwareError extends Error {
    constructor(message) {
        super(message);
    }

    getErrorJson() {
        return [this.message];
    }
}

class InvalidParamErrorBuilder {
    constructor() {
        this.invalidParams = [];
    }

    withInvalidParam(paramName, reason) {
        this.invalidParams.push({ paramName: paramName, reason: reason });
        return this;
    }

    throwIfInvalidParams() {
        if (this.invalidParams.length > 0) {
            throw this.build();
        }
    }

    build() {
        return new InvalidParamError(this);
    }
}

class InvalidParamError extends HttpAwareError {
    constructor(invalidParamBuilder) {
        super('Invalid params!');
        this.invalidParams = invalidParamBuilder.invalidParams;
    }

    getHttpCode() {
        return httpStatus.BAD_REQUEST;
    }

    getErrorJson() {
        return this.invalidParams;
    }
}

InvalidParamErrorBuilder.missing = 'parameter missing';
InvalidParamErrorBuilder.unsupportedValue = 'unsupported value';
InvalidParamErrorBuilder.notNull = 'must not be null';

function spammerErrorHandler(err, _0, res, _1) {
    if (err instanceof HttpAwareError) {
        res.status(err.getHttpCode()).json({ errors: err.getErrorJson() });
    } else {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            errors: [err.message],
        });
    }
    res.end();
}

module.exports = { spammerErrorHandler, HttpAwareError, InvalidParamErrorBuilder };
