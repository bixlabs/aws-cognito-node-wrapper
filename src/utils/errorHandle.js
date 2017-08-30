export default function (err, req, res, next) { //eslint-disable-line
  const error = {};
  error.msg = err.msg || 'Unknown reason';
  const status = err.status || '400';
  console.log(err);

  return res.status(status).send(error);
}
