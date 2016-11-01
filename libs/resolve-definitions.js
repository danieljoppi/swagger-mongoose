'use strict';
const $RE_FIND = /\#\/definitions\/([\w]+)/i;
const $RE_REPLACE = /\{\s*([^{}]*)"\$ref":"\#\/definitions\/([\w]+)"[,]?([^{}]*)[\},]/g;
const $RE_MONGOOSE_REF = /"x-swagger-mongoose-ref":["]?true["]?/i;

module.exports = function resolve({name, definitions = {}, track = '#/definitions'}) {
  let def = definitions[name];
  if (!def) {
    throw new Error(`Not found ${name} ["${track}"]`);
  } else if (def.type !== 'object' && !def.properties) {
    let array = def.allOf || def.oneOf || def.anyOf;
    if (!array || !array.length || array.every(item => item.type !== 'object' || !item.properties)) {
      array && console.log(name, !array , !array.length , array.every(item => item.type !== 'object' || !item.properties))
      throw new Error(`${name} ["${track}"] is not a object`);
    }
  }
  let entity = JSON.parse(JSON.stringify(def));

  entity.refs = {};
  entity = resolveEntityArray(entity);
  return findRelationship(entity);

  function findRelationship(def) {
    let str = JSON.stringify(def);
    for (let m; m = $RE_REPLACE.exec(str);) {
      let groupPre = m[1],
        nameRef = m[2],
        groupPos = m[3];
      if (nameRef && !entity.refs[nameRef]) {
        let entityRef = definitions[nameRef];
        if (nameRef !== name) {
          let isRef = $RE_MONGOOSE_REF.test(groupPre) || $RE_MONGOOSE_REF.test(groupPos);

          entityRef = resolveEntityArray(entityRef);
          if (!isRef) {
            let strRef = JSON.stringify(findRelationship(entityRef));
            strRef = strRef.substring(1, strRef.length - 1);

            str = str.replace(`"$ref":"#/definitions/${nameRef}"`, strRef);
          } else {
            entity.refs[nameRef] = entityRef;
          }
        }
      }
    }
    return JSON.parse(str);
  }

  function resolveEntityArray(entity) {
    if (entity.allOf || entity.oneOf || entity.anyOf) {
      let array = entity.allOf || entity.oneOf || entity.anyOf,
        object = {},
        properties = {},
        required = [];
      delete entity.allOf;

      delete entity.oneOf;
      delete entity.anyOf
      array.push(entity);

      for (let i = 0, len = array.length; i < len; i++) {
        let item = array[i];
        if (item.$ref) {
          let match = $RE_FIND.exec(item.$ref),
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
    return entity;
  }
};
