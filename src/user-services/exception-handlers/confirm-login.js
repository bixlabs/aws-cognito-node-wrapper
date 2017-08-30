import ResponseError from './response-error';
import GeneralExceptionHandler from './general-exceptions';

class ConfirmLoginExceptionHandler {

  error;

  constructor(error) {
    this.error = error;
    try {
      this.checkForInvalidUserPoolConfiguration();
      this.checkForPasswordResetRequired();
      GeneralExceptionHandler.checkForUserNotConfirmed(error);
      GeneralExceptionHandler.checkForInvalidParameters(error);
      GeneralExceptionHandler.checkForEmailAlreadyExist(error);
      GeneralExceptionHandler.checkForWrongConfirmationCode(error);
      GeneralExceptionHandler.checkForConfirmationCodeExpired(error);
      GeneralExceptionHandler.checkForTooManyRequests(error);
      GeneralExceptionHandler.checkForInvalidPassword(error);
      GeneralExceptionHandler.checkForNotAuthorized(error);
      GeneralExceptionHandler.checkForResourceNotFound(error);
      GeneralExceptionHandler.checkForUserNotFound(error);
      GeneralExceptionHandler.generalPurposeError();
    } catch (exception) {
      return exception;
    }
  }

  checkForInvalidUserPoolConfiguration() {
    if (this.error.code === 'InvalidUserPoolConfigurationException') {
      throw new ResponseError(400, 'Please make sure that the User Pool is configured properly.');
    }
  }

  checkForPasswordResetRequired() {
    if (this.error.code === 'PasswordResetRequiredException') {
      throw new ResponseError(400, 'A Password reset is required.');
    }
  }
}

export default ConfirmLoginExceptionHandler;
