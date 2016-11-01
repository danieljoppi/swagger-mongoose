'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const convertJSON = require('./libs/convert-json');
const makeSchema = require('./libs/make-schema');
const resolveDefinitions = require('./libs/resolve-definitions');

const compile = ({definitions = {}} =  {}, opts = {}) => {
  let names = Object.keys(definitions),
    entities = {};
  for (let n = 0, len = names.length; n < len; n++) {
    let name = names[n];

    if (entities[name]) {
      continue;
    }
    let def = definitions[name],
      excludeSchema = ~['false', false].indexOf(def['x-swagger-mongoose-schema']);
    if (excludeSchema) {
      continue;
    }

    try {
      let entity = resolveDefinitions({name, definitions});
      entities[name] = entity;
      let refs = entity.refs;

      entities = Object.assign({}, refs, entities);
    } catch (e) {
      if ('object' === def.type || def.properties) {
        throw e;
      }
    }
  }
  names = Object.keys(entities);

  let schemas = {},
    models = {};
  for (let n = 0, len = names.length; n < len; n++) {
    let name = names[n];
    let obj = makeSchema({name, entities});

    delete obj._id;
    delete obj.__v;

    let schema = schemas[name] = new mongoose.Schema(obj, opts);
    models[name] = mongoose.model(name, schema);
  }
  return {schemas, models};
};

module.exports = (swagger, opts) => {
  let json = convertJSON(swagger);
  return compile(json, opts);
};
