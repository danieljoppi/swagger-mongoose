'use strict';

module.exports = (spec) => {
  let type = typeof(spec);
  switch (type) {
    case 'object':
      if (spec instanceof Buffer) {
        return JSON.parse(spec);
      } else {
        return spec;
      }
    case 'string':
      return JSON.parse(spec);
    default:
      throw new Error('Unknown or invalid spec object');
  }
};
