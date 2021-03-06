import GeneralExceptionHandler from './general-exceptions';

class UpdateUserExceptionHandler {

  error;

  constructor(error) {
    this.error = error;
    try {
      GeneralExceptionHandler.checkForEmailAlreadyExist(error);
      GeneralExceptionHandler.checkForInvalidParameters(error);
      GeneralExceptionHandler.checkForTooManyRequests(error);
      GeneralExceptionHandler.checkForNotAuthorized(error);
      GeneralExceptionHandler.checkForResourceNotFound(error);
      GeneralExceptionHandler.checkForUserNotFound(error);
      GeneralExceptionHandler.generalPurposeError();
    } catch (exception) {
      return exception;
    }
  }
}

export default UpdateUserExceptionHandler;
