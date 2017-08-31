import ResponseError from './response-error';
import GeneralExceptionHandler from './general-exceptions';

class ForgotPasswordExceptionHandler {
  error;

  constructor(error) {
    this.error = error;
    try {
      this.checkForLimitExceed();
      this.checkForTooManyFailAttempts();
      this.checkForUserNotConfirmed();
      this.checkForEmailNotConfirmed();
      GeneralExceptionHandler.checkForWrongConfirmationCode(error);
      GeneralExceptionHandler.checkForConfirmationCodeExpired(error);
      GeneralExceptionHandler.checkForTooManyRequests(error);
      GeneralExceptionHandler.checkForUserNotFound(error);
      GeneralExceptionHandler.generalPurposeError();
    } catch (exception) {
      return exception;
    }
  }

  checkForLimitExceed() {
    if (this.error.code === 'LimitExceededException') {
      throw new ResponseError(429, 'Attempt limit exceeded, please try after some time.');
    }
  }

  checkForTooManyFailAttempts() {
    if (this.error.code === 'TooManyFailedAttemptsException') {
      throw new ResponseError(429, 'Too many fail attempts, please try again later');
    }
  }

  checkForUserNotConfirmed() {
    if (this.error.code === 'UserNotConfirmedException') {
      throw new ResponseError(400, 'Your user is not confirmed, please login and confirm it first');
    }
  }

  checkForEmailNotConfirmed() {
    if (this.error.code === 'InvalidEmailRoleAccessPolicyException') {
      throw new ReferenceError(400, 'Your email is not confirmed, please contact an Admin for support.');
    }
  }
}

export default ForgotPasswordExceptionHandler;
