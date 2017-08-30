import ResponseError from './response-error';
import GeneralExceptionHandler from './general-exceptions';

class ConfirmSignUpExceptionHandler {

  error;

  constructor(error) {
    this.error = error;
    try {
      this.checkForInvalidParameters();
      this.checkForTooManyFailAttempts();
      GeneralExceptionHandler.checkForEmailAlreadyExist(error);
      GeneralExceptionHandler.checkForWrongConfirmationCode(error);
      GeneralExceptionHandler.checkForConfirmationCodeExpired(error);
      GeneralExceptionHandler.checkForLimitExceed(error);
      GeneralExceptionHandler.checkForNotAuthorized(error);
      GeneralExceptionHandler.checkForResourceNotFound(error);
      GeneralExceptionHandler.checkForTooManyRequests(error);
      GeneralExceptionHandler.checkForUserNotFound(error);
      GeneralExceptionHandler.generalPurposeError();
    } catch (exception) {
      return exception;
    }
  }

  checkForInvalidParameters() {
    if (this.error.code === 'InvalidParameterException') {
      throw new ResponseError(400, this.error.message);
    }
  }

  checkForTooManyFailAttempts() {
    if (this.error.code === 'TooManyFailedAttemptsException') {
      throw new ResponseError(400, 'Too many fail attempts, please try again later');
    }
  }
}

export default ConfirmSignUpExceptionHandler;
