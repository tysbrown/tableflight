const { process: upstreamProcess } = require('@graphql-tools/jest-transform');

const process = (...args) => {
  const code = upstreamProcess(...args);
  return { code };
};

module.exports = { process };