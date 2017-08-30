import ResponseError from './response-error';
import GeneralExceptionHandler from './general-exceptions';

class LoginExceptionHandler {
  error;

  constructor(error) {
    this.error = error;
    try {
      this.checkForPasswordResetFlow();
      GeneralExceptionHandler.checkForNotAuthorized(error);
      GeneralExceptionHandler.checkForResourceNotFound(error);
      GeneralExceptionHandler.checkForUserNotFound(error);
      GeneralExceptionHandler.checkForUserNotConfirmed(error);
      GeneralExceptionHandler.checkForTooManyRequests(error);
      GeneralExceptionHandler.generalPurposeError();
    } catch (exception) {
      return exception;
    }
  }

  checkForPasswordResetFlow() {
    if (this.error.code === 'PasswordResetRequiredException') {
      throw new ResponseError(400, 'Finish resetting your password to be able to login');
    }
  }
}

export default LoginExceptionHandler;
