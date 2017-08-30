import environment from 'dotenv';
// load environment variables.
environment.config();

const common = {
  port: process.env.SERVICE_PORT
};
export default common;
