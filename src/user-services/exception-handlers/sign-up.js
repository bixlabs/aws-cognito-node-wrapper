import ResponseError from './response-error';
import GeneralExceptionHandler from './general-exceptions';

class SignUpExceptionHandler {

  error;

  constructor(error) {
    this.error = error;
    try {
      this.checkForEmailNotConfirmed();
      this.checkForCodeDeliveryFailure();
      this.checkForUsernameExist();
      GeneralExceptionHandler.checkForInvalidParameters(error);
      GeneralExceptionHandler.checkForInvalidPassword(error);
      GeneralExceptionHandler.checkForNotAuthorized(error);
      GeneralExceptionHandler.checkForResourceNotFound(error);
      GeneralExceptionHandler.checkForTooManyRequests(error);
      GeneralExceptionHandler.generalPurposeError();
    } catch (exception) {
      return exception;
    }
  }

  checkForEmailNotConfirmed() {
    if (this.error.code === 'InvalidEmailRoleAccessPolicyException') {
      throw new ReferenceError(400, 'For some reason your email could not be use for sign up.');
    }
  }

  checkForCodeDeliveryFailure() {
    if (this.error.code === 'CodeDeliveryFailureException') {
      throw new ResponseError(400, 'There was a problem delivering the confirmation code for the user.');
    }
  }

  checkForUsernameExist() {
    if (this.error.code === 'UsernameExistsException') {
      throw new ResponseError(400, 'The username you are trying to use already exist.');
    }
  }
}

export default SignUpExceptionHandler;
