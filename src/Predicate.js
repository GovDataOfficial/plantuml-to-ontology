const _ = require('underscore');

module.exports = (function () {
    var Predicate = function (peggypredicate) {
        this.name = peggypredicate.name ? peggypredicate.name : "";

        this.requirement = peggypredicate.requirement ? peggypredicate.requirement : "";
        this.cardinality = peggypredicate.cardinality ? peggypredicate.cardinality : {min: "", max: ""};
        this.range       = peggypredicate.range ? peggypredicate.range : "";

        this.attribute_names = _.allKeys(peggypredicate.attributes);

        this.attributes  = (function() { return peggypredicate.attributes; })();
    }

    return Predicate;

})()