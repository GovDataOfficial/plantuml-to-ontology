const _         = require('underscore');
const Predicate = require('./Predicate');

module.exports = (function () {
    var Class = function (peggyclass) {
        this.name = peggyclass.name ? peggyclass.name : "";

        this.superclassOf = peggyclass.superclassOf ? peggyclass.superclassOf : "";
        this.subclassOf = peggyclass.subclassOf ? peggyclass.subclassOf : "";
        
        this.attributes = (function() { return peggyclass.attributes; })();
        this.predicates = (function() { return _.map(peggyclass.predicates, function(el) { return new Predicate(el)}); })();

        this.attribute_names = _.allKeys(peggyclass.attributes);
        this.predicate_names = _.unique(_.pluck(_.flatten(peggyclass.predicates), "name"));
    }

    return Class;

})()