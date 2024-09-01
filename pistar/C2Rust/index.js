const antlr4 = require("antlr4/index");
const iStar2Lexer = require("./iStar2Lexer");
const iStar2Parser = require("./iStar2Parser");
const fs = require("fs");
const { Visitor, layout } = require("./Visitor");

function levelChild(goalmodel, actor) {
  var n = actor.nodes.length;
  var levels = [];
  var ops = [];
  for (i in actor.nodes) {
    levels[actor.nodes[i].id] = 0;
    ops[actor.nodes[i].id] = "";
  }
  var level = 0;
  do {
    var counted = 0;
    for (l in goalmodel.links) {
      var link = goalmodel.links[l];
      if (
        link.type.substring(6).toLowerCase() == "andrefinementlink" ||
        link.type.substring(6).toLowerCase() == "orrefinementlink"
      ) {
        if (levels[link.target] == level) {
          if (link.type.substring(6).toLowerCase() == "andrefinementlink") {
            ops[link.target] = "&";
          } else {
            ops[link.target] = "|";
          }
          levels[link.source] = level + 1;
          counted++;
        }
      }
    }
    level++;
  } while (counted > 0);
  for (i in actor.nodes) {
    actor.nodes[i].level = levels[actor.nodes[i].id];
    actor.nodes[i].op = ops[actor.nodes[i].id];
  }
  return level;
}
/**
 * Append contribute links to the source node, and identify the target node using its lineno instead of its id
 * @param {*} goalmodel
 * @param {*} linenos
 * @param {*} lines
 */
function contributionLinks(goalmodel, linenos, lines) {
  for (l in goalmodel.links) {
    link = goalmodel.links[l];
    if (link.type.substring(6).toLowerCase() == "contributionlink") {
      var label = "";
      if (link.label == "help") label = "+";
      if (link.label == "hurt") label = "-";
      if (link.label == "make") label = "++";
      if (link.label == "break") label = "--";
      source_lineno = linenos[link.source];
      if (source_lineno != null) {
        target_lineno = linenos[link.target];
        lines[source_lineno] += " " + label + target_lineno;
      }
    } else if (link.type.substring(6).toLowerCase() == "neededbylink") {
      var label = "-o";
      source_lineno = linenos[link.source];
      if (source_lineno != null) {
        target_lineno = linenos[link.target];
        lines[source_lineno] += " " + label + target_lineno;
      }
    } else if (link.type.substring(6).toLowerCase() == "qualificationlink") {
      var label = "~~";
      source_lineno = linenos[link.source];
      if (source_lineno != null) {
        target_lineno = linenos[link.target];
        lines[source_lineno] += " " + label + target_lineno;
      }
    }
  }
  for (d in goalmodel.dependencies) {
    dependency = goalmodel.dependencies[d];
    source_lineno = linenos[dependency.source];
    target_lineno = linenos[dependency.target];
    dependency_lineno = linenos[dependency.id];
    if (source_lineno != null) {
      lines[source_lineno] += " " + "~>" + dependency_lineno;
    }
    if (target_lineno != null) {
      lines[dependency_lineno] += " " + "~>" + target_lineno;
    } else if (source_lineno == null) {
      delete lines[dependency_lineno];
    }
  }
}

function pad(pad, str, padLeft) {
  if (typeof str === "undefined") return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}

function enumerate_children(goalmodel, node, lines, linenos, lineno) {
  var text = "";
  for (var i = 0; i < node.level + 1; i++) text += "    ";
  text +=
    "" +
    lineno +
    (goalmodel.display != null &&
    goalmodel.display[node.id] != null &&
    goalmodel.display[node.id].backgroundColor != null &&
    goalmodel.display[node.id].backgroundColor != "CCFACD"
      ? " " + toCompletion(goalmodel.display[node.id].backgroundColor)
      : "") +
    " " +
    node.type.substring(6).toLowerCase() +
    " {" +
    node.text.replace(/}/g, "\\}") +
    "} " +
    (node.customProperties != null &&
    node.customProperties.Description != null &&
    node.customProperties.Description != ""
      ? " {" + node.customProperties.Description.replace(/}/g, "\\}") + "}"
      : "") +
    (goalmodel.diagram.selected_actor != null ||
    goalmodel.diagram.layout ||
    node.x == null ||
    node.y == null
      ? ""
      : "@" + node.x + "," + node.y); // don't print the location if the actor is selected
  if (node.op != "") {
    text += " " + node.op;
  }
  linenos[node.id] = lineno;
  nodes[node.id] = node;
  lines[lineno++] = text;
  for (l in goalmodel.links) {
    var link = goalmodel.links[l];
    if (
      link.type.substring(6).toLowerCase() == "andrefinementlink" ||
      link.type.substring(6).toLowerCase() == "orrefinementlink"
    ) {
      if (link.target == node.id) {
        var child = nodes[link.source];
        lineno = enumerate_children(goalmodel, child, lines, linenos, lineno);
      }
    }
  }
  return lineno;
}

var storedColors = null;
function RGBfromYUV(y, u, v) {
  var r = y + 1.4075 * (v - 128);
  var g = y - 0.3455 * (u - 128) - 0.7169 * (v - 128);
  var b = y + 1.779 * (u - 128);

  r = Math.floor(r);
  g = Math.floor(g);
  b = Math.floor(b);

  r = r < 0 ? 0 : r;
  r = r > 255 ? 255 : r;

  g = g < 0 ? 0 : g;
  g = g > 255 ? 255 : g;

  b = b < 0 ? 0 : b;
  b = b > 255 ? 255 : b;

  r = r.toString(16);
  g = g.toString(16);
  b = b.toString(16);

  if (r.length < 2) {
    r = "0" + r;
  }
  if (g.length < 2) {
    g = "0" + g;
  }
  if (b.length < 2) {
    b = "0" + b;
  }
  return r + g + b;
}

function toColor(percentage) {
  var Y = 128;
  var U = 0;
  var V = (256 * (100 - percentage)) / 100.0;
  return RGBfromYUV(Y, U, V);
}

/**
 * First convert hex color into RGB numbers, then convert RGB numbers into YUV numbers, and
 * finally return (1-U)*100 as the indicator to the percentage of progress till completion
 * @param {*} hex
 */
function toCompletion(hex) {
  if (storedColors == null) {
    storedColors = {};
    for (var i = 0; i <= 100; i++) {
      storedColors[toColor(i)] = i;
    }
  }
  // console.log(hex)
  // var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  // if (result!=null) {
  // 	  var r = parseInt(result[1], 16)
  // 	  var g = parseInt(result[2], 16)
  // 	  var b = parseInt(result[3], 16)
  // 	  console.log(r +  " " + g + " " + b)
  // 	  var y, u, v;
  // 	  y = r *  .299000 + g *  .587000 + b *  .114000
  // 	  u = r * -.168736 + g * -.331264 + b *  .500000
  // 	  v = r *  .500000 + g * -.418688 + b * -.081312

  // 	  y = Math.floor(y);
  // 	  u = Math.floor(u);
  // 	  v = Math.floor(v);

  // 	  console.log(y +  " " + u + " " + v)
  // }
  var hex = hex.substring(1);
  var percentage = storedColors[hex];
  if (percentage == null) {
    return "";
  }
  return percentage + "%";
}

function convert_json_to_istar2(model, output_filename) {
  lines = [];
  lineno = 0;
  var goalmodel = JSON.parse(model);
  if (goalmodel.diagram != null && goalmodel.diagram.name != null) {
    lines[lineno++] =
      "{" +
      goalmodel.diagram.name +
      "}" +
      "{" +
      goalmodel.diagram.customProperties.Description +
      "}";
  } else {
    lineno++;
  }
  linenos = [];
  nodes = [];
  intention2actor = {};
  if (goalmodel.diagram.selected_actor != null) {
    goalmodel.diagram.layout = true;
  }
  for (a in goalmodel.actors) {
    var actor = goalmodel.actors[a];
    if (
      goalmodel.diagram != null &&
      goalmodel.diagram.selected_actor != null &&
      actor.id != goalmodel.diagram.selected_actor
    )
      continue;
    if (actor.type.startsWith("istar.")) {
      linenos[actor.id] = lineno;
      nodes[actor.id] = actor;
      actor.lineno = lineno;
      lines[lineno] =
        "" +
        lineno +
        (goalmodel.diagram != null && goalmodel.diagram.selected_actor != null
          ? " " + actor.layout
          : goalmodel.display != null &&
              goalmodel.display[actor.id] != null &&
              goalmodel.display[actor.id].collapsed == false
            ? " " + actor.layout
            : "") +
        (goalmodel.display != null &&
        goalmodel.display[actor.id] != null &&
        goalmodel.display[actor.id].backgroundColor != null
          ? " " + toCompletion(goalmodel.display[actor.id].backgroundColor)
          : "") +
        " " +
        actor.type.substring(6).toLowerCase() +
        " {" +
        actor.text.replace(/}/g, "\\}") +
        "} " +
        (actor.customProperties != null &&
        actor.customProperties.Description != null &&
        actor.customProperties.Description != ""
          ? " {" + actor.customProperties.Description.replace(/}/g, "\\}") + "}"
          : "") +
        (goalmodel.diagram.layout || actor.x == null || actor.y == null
          ? ""
          : "@" + actor.x + "," + actor.y + " ");
      lineno++;
      var L = levelChild(goalmodel, actor);
      for (n in actor.nodes) {
        var node = actor.nodes[n];
        nodes[node.id] = node;
        intention2actor[node.id] = actor.id;
      }
      for (n in actor.nodes) {
        var node = actor.nodes[n];
        if (node.level == 0) {
          lineno = enumerate_children(goalmodel, node, lines, linenos, lineno);
        }
      }
    }
  }
  for (d in goalmodel.dependencies) {
    dependency = goalmodel.dependencies[d];
    type = dependency.type.substring(6).toLowerCase();
    text =
      "" +
      lineno +
      " " +
      type +
      " {" +
      dependency.text.replace(/}/g, "\\}") +
      "} " +
      (dependency.customProperties != null &&
      dependency.customProperties.Description != null &&
      dependency.customProperties.Description != ""
        ? " {" +
          dependency.customProperties.Description.replace(/}/g, "\\}") +
          "}"
        : "") +
      (goalmodel.diagram.layout || dependency.x == null || dependency.y == null
        ? ""
        : "@" + dependency.x + "," + dependency.y + " ");
    linenos[dependency.id] = lineno;
    nodes[dependency.id] = dependency;
    lines[lineno++] = text;
  }
  contributionLinks(goalmodel, linenos, lines);
  if (output_filename != null) {
    try {
      fs.writeFileSync(output_filename, lines.join("\n") + "\n", {
        mode: 0o755,
      });
    } catch (err) {}
  } else {
    console.log(lines.join("\n") + "\n");
  }
}

function convert_istar2_to_goalmodel(tree, parser) {
  var visitor = new Visitor();
  return visitor.start(tree);
}

function load_istar2(input) {
  const chars = new antlr4.InputStream(input);
  const lexer = new iStar2Lexer.iStar2Lexer(chars);
  lexer.strictMode = false; // do not use js strictMode
  const tokens = new antlr4.CommonTokenStream(lexer);
  // console.log(tokens);
  const parser = new iStar2Parser.iStar2Parser(tokens);
  // const tree = parser.file_input();
  const tree = parser.single_input();
  var goalModel = convert_istar2_to_goalmodel(tree, parser);
  var model = {};
  model.actors = goalModel.actors;
  model.links = goalModel.links;
  model.dependencies = goalModel.dependencies;
  model.display = goalModel.display;
  // model.actors.forEach(function(a) {
  // 	a.nodes.forEach(function (n) {
  // 		console.log(model.display[n.id])
  // 	})
  // })
  model.diagram = goalModel.diagram;
  return model;
}

function save_istar2(goalmodel, output_file) {
  convert_json_to_istar2(goalmodel, output_file);
}

function merge_istar2(goalmodel, input) {
  var model = load_istar2(input);
  model.actors.forEach(function (a) {
    // appending the actor
    var found = false;
    goalmodel.actors.forEach(function (a0) {
      if (a0.text == a.text) {
        found = true;
      }
    });
    if (!found) {
      goalmodel.actors[goalmodel.actors.length] = a;
      if (goalmodel.display != null) {
        goalmodel.display[a.id] = model.display[a.id];
        a.nodes.forEach(function (n) {
          goalmodel.display[n.id] = model.display[n.id];
        });
      }
    }
  });
  model.links.forEach(function (l) {
    goalmodel.links[goalmodel.links.length] = l;
    if (goalmodel.display != null)
      goalmodel.display[l.id] = model.display[l.id];
  });
  model.dependencies.forEach(function (d) {
    var found = false;
    goalmodel.dependencies.forEach(function (d0) {
      if (d0.text == d.text) {
        if (d0.source == null && d.source != null) {
          d0.source = d.source;
        }
        if (d0.target == null && d.target != null) {
          d0.target = d.target;
        }
        if (d.source == null && d0.source != null) {
          d.source = d0.source;
        }
        if (d.target == null && d0.target != null) {
          d.target = d0.target;
        }
        if (d.source == d0.source && d.target == d0.target) {
          found = true; // redundant
        }
      }
    });
    if (!found) {
      goalmodel.dependencies[goalmodel.dependencies.length] = d;
      if (goalmodel.display != null)
        goalmodel.display[d.id] = model.display[d.id];
    }
  });
  layout(goalmodel);
  if (goalmodel.display == null) {
    goalmodel.display = model.display;
  }
  if (goalmodel.diagram == null) {
    goalmodel.diagram = model.diagram;
  }
  if (goalmodel.diagram.name == null && model.digram != null) {
    goalmodel.diagram.name = model.diagram.name;
  }
  if (
    goalmodel.diagram.customProperties == null &&
    model.diagram != null &&
    model.diagram.customProperties != null
  ) {
    goalmodel.diagram.customProperties = model.diagram.customProperties;
  }
  return goalmodel;
}

module.exports = { load_istar2, save_istar2, merge_istar2 };
