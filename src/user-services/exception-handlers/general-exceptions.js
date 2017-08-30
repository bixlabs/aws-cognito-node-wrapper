import ResponseError from './response-error';

class GeneralExceptionHandler {

  static checkForUserNotConfirmed(error) {
    if (error.code === 'UserNotConfirmedException') {
      throw new ResponseError(400, 'Your user is not confirmed yet, please contact support.');
    }
  }

  static checkForEmailAlreadyExist(error) {
    if (error.code === 'AliasExistsException') {
      throw new ResponseError(400, 'An Account with this email already exists.');
    }
  }

  static checkForInvalidParameters(error) {
    if (error.code === 'InvalidParameterException') {
      throw new ResponseError(400, error.message);
    }
  }

  static checkForWrongConfirmationCode(error) {
    if (error.code === 'CodeMismatchException') {
      throw new ResponseError(400, 'Confirmation code does not match with the one provided through email.');
    }
  }

  static checkForConfirmationCodeExpired(error) {
    if (error.code === 'ExpiredCodeException') {
      throw new ResponseError(400, 'Confirmation code has expired.');
    }
  }

  static checkForTooManyRequests(error) {
    if (error.code === 'TooManyRequestsException') {
      throw new ResponseError(400, 'Too many requests to this service, please try again later.');
    }
  }

  static checkForInvalidPassword(error) {
    if (error.code === 'InvalidPasswordException') {
      throw new ResponseError(400, 'The password does not meet the configure password criteria.');
    }
  }

  static checkForNotAuthorized(error) {
    if (error.code === 'NotAuthorizedException') {
      throw new ResponseError(400, error.message);
    }
  }

  static checkForResourceNotFound(error) {
    if (error.code === 'ResourceNotFoundException') {
      throw new ResponseError(400, error.message);
    }
  }

  static checkForUserNotFound(error) {
    if (error.code === 'UserNotFoundException') {
      throw new ResponseError(400, error.message);
    }
  }

  static generalPurposeError() {
    throw new ResponseError(500, 'Something went wrong in the server');
  }
}

export default GeneralExceptionHandler;
