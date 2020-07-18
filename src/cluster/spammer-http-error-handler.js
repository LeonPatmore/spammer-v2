const httpStatus = require('http-status-codes');

class HttpAwareError extends Error {
    /**
     * A HTTP aware error.
     * @param {String} message
     */
    constructor(message) {
        super(message);
    }

    getErrorJson() {
        return [this.message];
    }
}

class InvalidParamErrorBuilder {
    /**
     * A builder for a invalid param error.
     */
    constructor() {
        this.invalidParams = [];
    }

    /**
     * Add an invalid param.
     * @param {String} paramName    The name of the invalid parameter.
     * @param {String} reason       The reason the parameter is invalid.
     */
    withInvalidParam(paramName, reason) {
        this.invalidParams.push({ paramName: paramName, reason: reason });
        return this;
    }

    /**
     * Throws an invalid params error if there is at-least one invalid paramter.
     */
    throwIfInvalidParams() {
        if (this.invalidParams.length > 0) {
            throw this.build();
        }
    }

    /**
     * Build an invalid param error.
     */
    build() {
        return new InvalidParamError(this);
    }
}

class InvalidParamError extends HttpAwareError {
    /**
     * An error for invalid parameters of a HTTP request.
     * @param {InvalidParamErrorBuilder} invalidParamBuilder    The builder object.
     */
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
