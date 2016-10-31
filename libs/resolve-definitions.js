'use strict';
const $RE = /\$ref":"\#\/definitions\/([\w]+)"/g;

module.exports = function resolve({name, definitions = {}, track = '#/definitions'}) {
  let def = definitions[name];
  if (!def) {
    throw new Error(`Not found ${name} ["${track}"]`);
  } else if (def.type !== 'object' && !def.properties) {
    throw new Error(`${name} ["${track}"] is not a object`);
  }
  let entity = JSON.parse(JSON.stringify(def));

  entity.refs = {};
  if (entity.allOf || entity.oneOf || entity.anyOf) {
    let array = entity.allOf || entity.oneOf || entity.anyOf,
      object = {},
      properties = {},
      required = [];
    for (let i = 0, len = array.length; i < len; i++) {
      let item = array[i];
      if (item.$ref) {
        let match = $RE.exec(item.$ref),
          nameRef = match && match[1];
        item = resolve({
          name: nameRef,
          definitions,
          track: `${track}/${nameRef}`
        });
      }
      Object.assign(object, item);
      Object.assign(properties, item.properties);
      if (item.required && item.required.length) {
        required.push(...item.required);
      }
    }
    object.properties = properties;
    object.required = required;
    entity = object
  }
  return findRelationship(entity);

  function findRelationship(def) {
    let str = JSON.stringify(def);
    for (let m; m = $RE.exec(str);) {
      let nameRef = m[1];
      if (nameRef && !entity.refs[nameRef]) {
        let entityRef = definitions[nameRef],
          isSchema = ~['true', true].indexOf(entityRef['x-swagger-mongoose-schema']),
          strRef;

        if (nameRef !== name) {
          if (isSchema) {
            strRef = JSON.stringify(entityRef);
          } else {
            strRef = JSON.stringify(findRelationship(entityRef));
          }
          strRef = strRef.substring(1, strRef.length - 1);

          if (isSchema) {
            entity.refs[nameRef] = entityRef;
          } else {
            str = str.replace(`"$ref":"#/definitions/${nameRef}"`, strRef);
          }
        }
      }
    }
    return JSON.parse(str);
  }
};
