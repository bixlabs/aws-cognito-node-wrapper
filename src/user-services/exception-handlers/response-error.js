class ResponseError {
  status;
  data = {};

  constructor(status, message) {
    this.status = status;
    this.data.message = message;
    return this.toJSON();
  }

  toJSON() {
    return {
      status: this.status,
      data: this.data
    };
  }
}

export default ResponseError;
