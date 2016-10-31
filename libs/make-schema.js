'use strict';
const propertyMap = require('./property-map');

module.exports = ({name, entities}) => {
  let entity = entities[name];
  if (!entity) {
    throw new Error(`Not found ${name}`);
  }

  return makeSchema(entity);

  function makeSchema(entity) {
    let {required = [], properties = {}} = entity,
      fields = Object.keys(properties),
      schema = {};

    const $RE = /\#\/definitions\/([\w-]+)/i;
    for (let f = 0, len = fields.length; f < len; f++) {
      let fieldName = fields[f],
        property = properties[fieldName],
        field = {};


      let type = propertyMap(property);
      if ('function' === typeof type || (Array.isArray(type) && 'function' === typeof type[0])) {
        field.type = type;
        let o = Array.isArray(type) ? type[0] : type;
        if (Number === o) {
          if (property.minimum) {
            field.min = property.minimum;
          }
          if (property.maximum) {
            field.max = property.maximum;
          }
        }
      } else {
        field.type = makeSchema(property);
      }
      let ref = property.$ref || (property.items && property.items.$ref);
      if (ref && $RE.test(ref)) {
        field.ref = $RE.exec(ref)[1];
      }

      if (~required.indexOf(fieldName)) {
        field.required = true;
      }
      if (property.default) {
        field.default = property.default
      }
      if (property.enum) {
        field.enum = property.enum
      }
      if (~['true', true].indexOf(property['x-mongoose-field-unique'])) {
        field.unique = true;
      }
      if (property['x-mongoose-field-index']) {
        field.index = property['x-mongoose-field-index'];

      }

      schema[fieldName] = field;
    }

    return schema;
  }
};
