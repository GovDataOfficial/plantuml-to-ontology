{{
  function combineAttributes(attrArray) {
    let attributes = {};
    attrArray = cleanArray(attrArray);
    
    for (var i = 0; i < attrArray.length; i++) { 
      if (attributes.hasOwnProperty(attrArray[i].key)) { 
          attributes[attrArray[i].key].push(attrArray[i].value);
         } else {
          attributes[attrArray[i].key] = [attrArray[i].value];
         }
    }
    return attributes;
  }
  
  function cleanArray(arr) {
    for (var i = 0; i < arr.length; i++) { 
      if (arr[i]===null) { 
          arr.splice(i, 1); i--; 
         } 
    }
    return arr;
  }
  
  function createPredicate(name, req, card, range, attributes) {
    return {
      name: name,
      requirement: req,
      cardinality: card,
      range: range,
      attributes: attributes
    }
  }

  function classHasPredicate(classObj, predicateName) {
    let ret = false;

    try {
      classObj.predicates.forEach(element => {
        if (element.name == predicateName) ret = true;
      });
    } catch (error) { }

    return ret;
  }
}}

{
  var ontology = {
    warnings: [],
    classes:  {},
    rest:     {},
  }
  
  function addPredicate(domain, card, range, req, name, attributes) {
    if (ontology.classes[domain] == undefined) {
      ontology.warnings.push(`Predicate ${name}'s domain (${domain}), defined in line ${location().start.line}, was not part of the Ontology. Added!`);
      addClass(domain, "", "", [], {"Error": [`Created for predicate ${name}, defined in line ${location().start.line}.`]});
    }
    
    if (classHasPredicate(ontology.classes[domain], name)) {
      ontology.warnings.push(`Predicate ${name}, defined in line ${location().start.line}, already exists within class ${domain}!`);
    }
    
    ontology.classes[domain].predicates.push(createPredicate(name, req, card, range, attributes));
  }
  
  function addClass(name, req, color, predicates, attributes) {
    let errors = [];
    if (ontology.classes[name] != undefined) ontology.warnings.push(`Class ${name} already exists! Overwritten with data from line ${location().start.line}!`);

    ontology.classes[name] = {
      name: name,
      requirement: req,
      color: color,
      superclassOf: "",
      subclassOf: "",
      attributes: attributes,
      predicates: predicates,
    }
  }
  
  function createInheritance(sub, parent) {
    if (ontology.classes[sub] == undefined) {
      ontology.warnings.push(`The class ${sub}, used in line ${location().start.line} as sub-class of ${parent}, was not part of the Ontology. Added!`);
      addClass(sub, "", "", [], {"Error": [`Created to be sub-class of ${parent}, defined in line ${location().start.line}.`]});
    }
    if (ontology.classes[parent] == undefined) {
      ontology.warnings.push(`The class ${parent}, used in line ${location().start.line} as super-class of ${sub}, was not part of the Ontology. Added!`);
      addClass(parent, "", "", [], {"Error": [`Created to be super-class of ${sub}, defined in line ${location().start.line}.`]});
    }

    ontology.classes[sub].subclassOf = parent;
    ontology.classes[parent].superclassOf = sub;
  }

  function addRest(text) {
    if (Array.isArray(text)) text = text.join("");
    let nr = Number(location().start.line);
    ontology.rest[nr] = text;
    return nr + ": " + text;
  }
}

ontology = ontologyparts+  { return ontology; }

ontologyparts
  = rdfclass           { return null; }
  / externalpredicate  { return null; }
  / inheritance        { return null; }
  / _ newline          { return null; }
  / c:richestchars+    { addRest(c); return null; }

inheritance
  = _ sub:rdfname _ inheritarrow _ parent:rdfname { createInheritance(sub, parent); return null; }

rdfclass 
  = _ "class " _ name:rdfname _ req:rdfrequirement? _ color:color? _ "{" predicates:classlines "}" _ attributes:attributelines { addClass(name, req, color, predicates, attributes); return null; }
  / _ "class " _ name:rdfname _ req:rdfrequirement? _ color:color? _                                 attributes:attributelines { addClass(name, req, color, [], attributes); return null; }

predicate
  = _ req:rdfrequirement? _ name:rdfname _ "~>" _ range:rdfname _  card:rdfcardinality? attributes:attributelines { return createPredicate(name, req, card, range, attributes); }

externalpredicate
  = domain:rdfname _ arrow _ card:rdfcardinality? _ range:rdfname _ ':' _ req:rdfrequirement? _ name:rdfname attributes:attributelines { addPredicate(domain, card, range, req, name, attributes); return null; }


classlines = preds:classline*  { return cleanArray(preds); }
classline
  = pred:predicate _           { return pred; }
  / _ newline                  { return null; }
  / _ (!"}") c:richestchars+   { addRest(c); return null; } 


attributelines
  = lines:(attributeline*)                                     { return combineAttributes(lines); }
attributeline
  = newline _ "'@" _ key:rdfname _ "=" _ value:(richestchars*) { return {key: key, value: value.join("")}; }
  / _ newline                                                  { return null; }
  / _ ("'") c:richestchars+                                    { addRest(["'", ...c]); return null; }



rdfname 
  = [\"] _ item:(namechars+) _ [\"] { return item.join(""); }
  / item:(namechars+)               { return item.join(""); }

rdfrequirement = "<<" _ item:(numchars+) _ ">>" { return item.join(""); }

rdfcardinality
  =   "["  from:[0-9]+ ".." to:[0-9]+    "]" { return {"min": from.join(""), "max": to.join("") }; }
  /   "["  from:[0-9]+ ".." to:[n|\*]    "]" { return {"min": from.join(""), "max": to }; }
  /   "["  to:[0-9]+                     "]" { return {"min": to.join(""), "max": to.join("") }; }
  /   "["  to:[n|\*]                     "]" { return {"min": to, "max": to }; }
  /  "\""  from:[0-9]+ ".." to:[0-9]+   "\"" { return {"min": from.join(""), "max": to.join("") }; }
  /  "\""  from:[0-9]+ ".." to:[n|\*]   "\"" { return {"min": from.join(""), "max": to }; }
  /  "\""  to:[0-9]+                    "\"" { return {"min": to.join(""), "max": to.join("") }; }
  /  "\""  to:[n|\*]                    "\"" { return {"min": to, "max": to }; }

color        = [#] item:colorchars+ { return "#" + item.join(""); }

arrow        = [\-]+ ">"
             / [\-]+ "up"    [\-]+ ">"
             / [\-]+ "down"  [\-]+ ">"
             / [\-]+ "left"  [\-]+ ">"
             / [\-]+ "right" [\-]+ ">"

inheritarrow = [\-]+ "|>"
             / [\-]+ "up"    [\-]+ "|>"
             / [\-]+ "down"  [\-]+ "|>"
             / [\-]+ "left"  [\-]+ "|>"
             / [\-]+ "right" [\-]+ "|>"

_            = [ \t]*
newline      = [\r\n] / [\n]
numchars     = [A-Za-z0-9]
namechars    = [a-zA-Z0-9:_-]
colorchars   = [0-9a-fA-F-/\|\\]
richchars    = [A-Za-z0-9_:;~#!§$()\[\]\+\-\*\\/|,]
richerchars  = [A-Za-z0-9_:;~#!§$()\[\]\+\-\*\\/|,{} ]
richestchars = [A-Za-z0-9_:;~#!§%()\[\]\+\-\*\\/|,{} <>@äöüÄÖÜß&$=`\.\?\"\']