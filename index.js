'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const convertJSON = require('./libs/convert-json');
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
      if (def.type === 'object' || def.properties) {
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

    obj._id = {
      type: Schema.Types.ObjectId,
      unique: true,
      default: () => new Schema.Types.ObjectId()
    };

    let schema = schemas[name] = new mongoose.Schema(obj);
    models[name] = mongoose.model(name, schema);
  }
  return {schemas, models};
};

module.exports = (swagger) => {
  let json = convertJSON(swagger);
  return compile(json);
};
