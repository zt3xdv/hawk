var XHRSettings = function (
  responseType,
  async,
  user,
  password,
  timeout,
  withCredentials,
) {
  if (responseType === undefined) {
    responseType = '';
  }
  if (async === undefined) {
    async = true;
  }
  if (user === undefined) {
    user = '';
  }
  if (password === undefined) {
    password = '';
  }
  if (timeout === undefined) {
    timeout = 0;
  }
  if (withCredentials === undefined) {
    withCredentials = false;
  }
  return {
    responseType: responseType,
    async: async,
    user: user,
    password: password,
    timeout: timeout,
    headers: undefined,
    header: undefined,
    headerValue: undefined,
    requestedWith: false,
    overrideMimeType: undefined,
    withCredentials: withCredentials,
  };
};
module.exports = XHRSettings;
