import path from 'path';
import swagger from 'swagger-jsdoc';

export default async function(req, res) {
  // swagger definition comes here
  const swaggerDefinition = {
    info: {
      title: 'AWS Cognito Node Wrapper',
      version: '1.0.0',
      description: '',
    }
  };
  const options = {
    swaggerDefinition,
    // we need to put the correct path here, for now it's not correct because the swagger documentation is not 100% working
    // path.resolve('src/user-services/**/*.js')
    apis: [path.resolve('src/user-services/**/*.js')],
  };

  const swaggerSpec = swagger(options);
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
}
