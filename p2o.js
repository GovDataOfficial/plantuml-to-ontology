const fs        = require("fs");
const path      = require("path");
const peggy     = require("peggy");
const generate  = require("./src/generate");

let peggydata;
let input_src;

const default_out_dir = path.resolve(__dirname, "output");
const template_path = path.resolve(__dirname, 'templates');
let groups = [];

let args = process.argv.slice(2);
let input_file = args.shift();

console.warn();
console.warn(`=== Loading PlantUML File ===================================`);
try {
    input_src   = fs.readFileSync(path.resolve(input_file), {encoding: 'utf-8', flag:'r'});
    console.warn(`Successfully loaded file ${input_file}`);
    console.warn();
} catch (error) {
    if (input_file)  console.warn(`Error: "${input_file}" couln not be opened!`);
    if (!input_file) console.warn(`Error: No input file provided!`);
    console.warn();
    console.warn(error);
    process.exit();
}

const grammar_src = fs.readFileSync(path.resolve(__dirname, "src", "p2o.peggy"), {encoding: 'utf-8', flag:'r'});
const parser = peggy.generate(grammar_src);

console.warn();
console.warn(`=== Generating Ontology Data Structure ======================`);
try {
    peggydata = parser.parse(input_src);
    console.warn(`Success!`);
    console.warn();
} catch (error) {
    console.warn();
    console.warn(error);
    process.exit();
}

let activegroup, elem;
function emptygroup() {
    return {
        templates: [],
        extension: "md",
        json: false,
        outdir: default_out_dir
    } 
}

if (!args.length) {
    groups.push(emptygroup());
}

while (args.length) {
    activegroup = emptygroup();
    elem = args.shift();
    while (elem && elem.substring(0,1) != "-") {
        if (elem != "json") activegroup.templates.push(elem+".hbs");
        if (elem == "json") activegroup.json = true;
        elem = args.shift();
    }

    if (elem == "-e") {
        elem = args.shift();
        activegroup.extension = elem;
        elem = args.shift();
    }
    
    if (elem == "-o") {
        elem = args.shift();
        activegroup.outdir = path.resolve(__dirname, elem);
        elem = args.shift();
    }

    if (elem) args.unshift(elem);
    groups.push(activegroup);
}


console.warn();
console.warn(`=== Generating Output For Templates =========================`);

groups.forEach((currentgroup) => {
    if (currentgroup.templates.length == 0 && currentgroup.json == true) {
        // generate only json-representation
        generate.toJson(peggydata, currentgroup.outdir);
        
    } else if (currentgroup.templates.length == 0 && currentgroup.json == false) {
        // use all templates in template dir
        generate.all(peggydata, template_path, currentgroup.extension, currentgroup.outdir);
        
    } else {
        // use all specified templates and maybe generate json-representation
        currentgroup.templates.forEach((tmpl) => generate.byTemplate(peggydata, template_path, tmpl, currentgroup.extension, currentgroup.outdir));
        if (currentgroup.json) generate.toJson(peggydata, currentgroup.outdir);
    }
});

console.warn()
console.warn(`========================= Good Bye ==========================`);
process.exit();


// console.warn(ontology);