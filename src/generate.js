const _        = require('underscore');
const fs       = require("fs");
const hbs      = require("handlebars");
const path     = require("path");
const Ontology = require("./Ontology");

hbs.registerHelper({
    eq: (v1, v2)   => String(v1) === String(v2),
    ne: (v1, v2)   => String(v1) !== String(v2),
    lt: (v1, v2)   => v1 < v2,
    gt: (v1, v2)   => v1 > v2,
    lte: (v1, v2)  => v1 <= v2,
    gte: (v1, v2)  => v1 >= v2,
    and: (v1, v2)  => v1 && v2,
    or: (v1, v2)   => v1 || v2,
    add: (v1, v2)  => new hbs.SafeString(Number(v1)+Number(v2)),
    lower: (v1)    => String(v1).toLowerCase(),
    upper: (v1)    => String(v1).toUpperCase(),
    char1: (v1)    => String(v1).substring(0,1),
    swap: (input, ...switches) => {
        switches = switches.slice(0, -1);
        if (!switches.length) return input;
        let pos = switches.indexOf(input);
        if (pos == -1)        return input;
        if (!switches[pos+1]) return switches[0];
        return switches[pos+1];
      },
    join: (item, text, unique) => {
        if (_.isString(item)) return item;
        
        let _i, _u;
        _u = (unique === undefined) ? false : unique;
        _u = (_u === true) ? true : false;

        if (_.isObject(item)) _i = _.values(item);
        if (_.isArray(item))  _i = item;
        if (unique) _i = _.unique(_i);

        if (_.isObject(item)) return new hbs.SafeString(_i.join(text));
        if (_.isArray(item))  return new hbs.SafeString(_i.join(text));
        return "";
    },
    sort: (list) => _.sortBy(list),
    sortByName: (list) => _.sortBy(list, "name"),
    sortByAttribute: (list, attribute) => _.sortBy(list, (elem) => elem.attributes[attribute]),
    sortByRequirement: (list, order) => _.sortBy(list, (elem) => order.indexOf(elem.requirement.substring(0,1))),
    filterHasAttribute: (list, attribute) => _.filter(list, (elem) => { 
        return (elem.attribute_names && elem.attribute_names.indexOf(attribute) != -1); 
    })
});

const byTemplate = function (peggydata, template_dir, template_file, extension, output_dir) {
    const ontology = new Ontology(peggydata);
    let template_data;
    let template;

    try {
        template_data = fs.readFileSync(path.resolve(template_dir, template_file), {encoding: 'utf-8', flag:'r'});
        template = hbs.compile(template_data);
    } catch (error) {
        console.warn();
        console.warn(error);
        process.exit();
    }

    extension = extension.substring(0,1) == "." ? extension : "." + extension;
    const output = template(ontology, {allowProtoMethodsByDefault: true});
    const output_file = template_file.replace(".hbs", extension);

    try {
        fs.writeFileSync(path.resolve(output_dir, output_file), output, {encoding: 'utf-8', flag:'w'});
        console.warn(`Template ${template_file} written successfully to ${output_dir}\\${output_file}`);
    } catch(error) {
        console.warn();
        console.warn(error);
        process.exit();
    }
};

const all = function (peggydata, template_dir, extension, output_dir) {
    const templates = fs.readdirSync(template_dir);

    templates.forEach((file, index) => {
        byTemplate(peggydata, template_dir, file, extension, output_dir);
    });

    console.warn();
    console.warn(`All templates used.`);
    
};

const toJson = function (peggydata, output_dir) {
    let output;
    
    try {
        output = JSON.stringify(peggydata);
    } catch (error) {
        console.warn(`Error: Could not create JSON output!`);
        console.warn();
        console.warn(error);
        process.exit();
    }

    try {
        fs.writeFileSync(path.resolve(output_dir, "ontology.json"), output, {encoding: 'utf-8', flag:'w'});
        console.warn(`Exportet ontology successfully to ${output_dir}\\ontology.json`);
    } catch(error) {
        console.warn();
        console.warn(error);
        process.exit();
    }
}

exports.byTemplate = byTemplate;
exports.all = all;
exports.toJson = toJson;
