function resolveErrorAndRespond(error, ErrorHandler, response) {
  const exception = new ErrorHandler(error);
  response.status(exception.status).send({data: exception.data});
}

export {resolveErrorAndRespond};
