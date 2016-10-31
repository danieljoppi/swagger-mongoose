'use strict';
const mongoose = require('mongoose');
const makeSchema = require('./libs/make-schema');
const resolveDefinitions = require('./libs/resolve-definitions');

const compile = ({definitions = {}} =  {}) => {
  let names = Object.keys(definitions),
    entities = {};
  for (let n = 0, len = names.length; n < len; n++) {
    let name = names[n];

    if (entities[name]) {
      continue;
    }
    let entity = resolveDefinitions({name, definitions});
    entities[name] = entity;
    let refs = entity.refs;

    entities = Object.assign({}, refs, entities);
  }
  names = Object.keys(entities);

  let schemas = {},
    models = {};
  for (let n = 0, len = names.length; n < len; n++) {
    let name = names[n];

    let obj = makeSchema({name, entities});

    let schema = schemas[name] = new mongoose.Schema(obj);
    models[name] = mongoose.model(name, schema);
  }
  return {schemas, models};
};

module.exports = (swagger) => {
  if ('string' === typeof swagger) {
    return compile(JSON.parse(swagger));
  } else {
    return compile(swagger);
  }
};
