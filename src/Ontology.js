const _         = require('underscore');
const Predicate = require('./Predicate');
const Class     = require("./Class");

module.exports = (function () {
    var Ontology = function (peggydata) {
        this.name = "My Ontology";

        this.peggydata = peggydata;
        this.warnings  = peggydata.warnings;
        this.rest      = peggydata.rest;
    
        this.class_names               = _.allKeys(peggydata.classes);
        this.class_attribute_names     = _.unique(_.flatten(_.map(_.pluck(_.values(peggydata.classes), "attributes"), function(el) { return _.allKeys(el) })));
        this.predicate_names           = _.unique(_.pluck(_.flatten(_.pluck(_.values(peggydata.classes), "predicates")), "name"));
        this.predicate_attribute_names = _.unique(_.flatten(_.map(_.pluck(_.flatten(_.pluck(_.values(peggydata.classes), "predicates")), "attributes"), function(el) { return _.allKeys(el) })));
    
        this.classes = _.values(_.mapObject(peggydata.classes, (value, key) => new Class(value)));
    }

    return Ontology;

})()