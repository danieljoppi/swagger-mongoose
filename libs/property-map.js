'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = function propertyMap(property) {
  if (property.$ref) {
    return Schema.Types.ObjectId;
  }
  switch (property.type) {
    case 'number':
      switch (property.format) {
        case 'integer':
        case 'long':
        case 'float':
        case 'double':
          return Number;
        default:
          throw new Error(`Unrecognised schema format: ${property.format}`);
      }
    case 'integer':
    case 'long' :
    case 'float' :
    case 'double' :
      return Number;
    case 'string':
    case 'password':
      return String;
    case 'boolean':
      return Boolean;
    case 'date':
    case 'dateTime':
    case 'date-time':
      return Date;
    case 'array':
      return [propertyMap(property.items)];
    case 'object':
      return property;
    default:
      throw new Error(`Unrecognized schema type: ${property.type}`);
  }
};
