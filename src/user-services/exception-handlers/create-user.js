import ResponseError from './response-error';
import GeneralExceptionHandler from './general-exceptions';

class CreateUserExceptionHandler {

  error;

  constructor(error) {
    this.error = error;
    try {
      this.checkForCodeDeliveryFailure();
      this.checkForUnsupportedUserState();
      this.checkForUsernameExist();
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

  checkForCodeDeliveryFailure() {
    if (this.error.code === 'CodeDeliveryFailureException') {
      throw new ResponseError(400, 'There was a problem delivering the confirmation code for the user.');
    }
  }

  checkForUnsupportedUserState() {
    if (this.error.code === 'UnsupportedUserStateException') {
      throw new ResponseError(400, 'A problem with user state happened, probably because the user exist already in an' +
        'unsupported state.');
    }
  }

  checkForUsernameExist() {
    if (this.error.code === 'UsernameExistsException') {
      throw new ResponseError(400, 'The username you are trying to use already exist.');
    }
  }
}

export default CreateUserExceptionHandler;
