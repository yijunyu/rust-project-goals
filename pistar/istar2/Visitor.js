const { triggerAsyncId } = require('async_hooks');
const { v4: uuidv4 } = require('uuid');
const dagre = require('dagre');
const iStar2ParserVisitor = require('./iStar2ParserVisitor').iStar2ParserVisitor;

function layout(goalModel) {
  // layout the rationale of each actor, i.e., decomposition and contribution links
  var goal2actor = {};
  goalModel.actors.forEach(function (actor) {
    var g = new dagre.graphlib.Graph();
    g.setGraph({});
    g.setDefaultEdgeLabel(function () { return {}; });
    g.graph().nodesep = g.graph().edgesep = 1;
    g.graph().rankdir = actor.layout;
    actor.nodes.forEach(function (node) {
      g.setNode(node.id, {
        label: node.text,
        width: goalModel.display != null && goalModel.display[node.id] != null ? goalModel.display[node.id].width : 100,
        height: goalModel.display != null && goalModel.display[node.id] != null ? goalModel.display[node.id].height : 37
      });
      goal2actor[node.id] = actor.id;
    });
    goalModel.links.forEach(function (link) {
      if (actor.nodes.some(e => e.id === link.source)
        && actor.nodes.some(e => e.id === link.target)) {
        if (link.type == "istar.AndRefinementLink" || link.type == "istar.OrRefinementLink")
          g.setEdge(link.target, link.source);
        else
          // g.setEdge(link.source, link.target); // we could make the quality requirements on the other side of the rationale layout
          g.setEdge(link.target, link.source);
      }
    });
    dagre.layout(g);
    var max_x = 1;
    var max_y = 1;
    g.nodes().forEach(function (v) {
      var node = g.node(v)
      actor.nodes.forEach(function (n) {
        if (n.id == v) {
          n.x = node.x;
          n.y = node.y;
          max_x = Math.max(max_x, n.x)
          max_y = Math.max(max_y, n.y)
        }
      });
    });
    actor.x = 100;
    actor.y = 100;
    // resize the actor if the actor is not collapsed
    if (goalModel.display != null && goalModel.display[actor.id] != null)
      if (goalModel.display[actor.id].collapsed != null && !goalModel.display[actor.id].collapsed) {
        goalModel.display[actor.id].width = max_x + 2 * goalModel.display[actor.id].width;
        goalModel.display[actor.id].height = max_y + 2 * goalModel.display[actor.id].height;
      }
  });
  // layout the dependencies among the actors
  var g = new dagre.graphlib.Graph();
  g.setGraph({});
  g.setDefaultEdgeLabel(function () { return {}; });
  if (add_dependum) 
	  g.graph().nodesep = g.graph().edgesep = 10;
  else
	  g.graph().nodesep = g.graph().edgesep = 200;
  g.graph.ranker = "longest-path" // "tight-tree" // 
  g.graph().rankdir = "TB"
  // we try to layout dependum of same name together as if they are the same node
  // in this case, the dependum_id refers to the representative node of all the dependum of the same name
  var added_dependums = {}
  // var add_dependum = false
  var add_dependum = true
  actors = {}
  goalModel.actors.forEach(function (actor) {
    actors[actor.id] = actor
    if (goalModel.display != null && goalModel.display[actor.id] != null) {
      g.setNode(actor.id, {
	label: actor.text,
	width: goalModel.display[actor.id].width,
	height: goalModel.display[actor.id].height
      });
    }
  });
  goalModel.dependencies.forEach(function (dependency) {
    if (added_dependums[dependency.text] == null) {
      added_dependums[dependency.text] = dependency.id
      if (add_dependum) {
	      if (goalModel.display != null && goalModel.display[dependency.id] != null) {
		g.setNode(dependency.id, {
		  label: dependency.text,
		  width: goalModel.display[dependency.id].width + 100,
		  height: goalModel.display[dependency.id].height + 100,
		  color: goalModel.display[dependency.id].color
		});
	      }
	      var dependum_id = added_dependums[dependency.text]
	      g.setEdge(dependum_id, goal2actor[dependency.target]);
	      g.setEdge(goal2actor[dependency.source], dependum_id);
      } else {
	      if (dependency.source!=null && dependency.target!=null)
		      g.setEdge(goal2actor[dependency.source], goal2actor[dependency.target]);
      }
    }
  });
  var max_x = 0;
  var max_y = 0;
  dagre.layout(g);
  g.nodes().forEach(function (v) {
    var node = g.node(v)
    goalModel.actors.forEach(function (actor) {
      if (actor.id == v && node != null) {
        actor.x = node.x - goalModel.display[actor.id].width / 2 + 1 + 100;
        actor.y = node.y - goalModel.display[actor.id].height / 2 + 1 + 100;
        max_x = Math.max(max_x, actor.x + goalModel.display[actor.id].width);
        max_y = Math.max(max_y, actor.y + goalModel.display[actor.id].height);
        // move the rationales along with the actors
        actor.nodes.forEach(function (n) {
          n.x += node.x - goalModel.display[actor.id].width / 2 - 1;
          n.y += node.y - goalModel.display[actor.id].height / 2 - 1;
          if (goalModel.display[n.id] != null) {
            max_x = Math.max(max_x, n.x + goalModel.display[n.id].width);
            max_y = Math.max(max_y, n.y + goalModel.display[n.id].height);
          }
        });
      }
    });
    goalModel.dependencies.forEach(function (dependency) {
        if (add_dependum) {
	      if (added_dependums[dependency.text] == v && node != null) {
		dependency.x = node.x - goalModel.display[dependency.id].width / 2 + 1 + 100;
		dependency.y = node.y - goalModel.display[dependency.id].height / 2 + 1 + 100;
		max_x = Math.max(max_x, dependency.x + goalModel.display[dependency.id].width);
		max_y = Math.max(max_y, dependency.y + goalModel.display[dependency.id].height);
	      }
	} 
    });
  });
  if (!add_dependum) {
	    var count = []
	    goalModel.dependencies.forEach(function (dependency) {
		var source = null
		var target = null
		if (dependency.source != null) {
			if (goal2actor[dependency.source] != null)  {
			    source = goal2actor[dependency.source]
			}
			else
			    source = dependency.source
		}
		if (dependency.target != null) {
			if (goal2actor[dependency.target] != null) 
			    target = goal2actor[dependency.target]
			else
			    target = dependency.target
		}
		if (source != null && target != null) {
			if (count[source + "~>" + target]==null) {
			       	count[source + "~>" + target] = 1
			} else {
			       	count[source + "~>" + target] ++
			}
		}
	    });
	    count.forEach(function (pair) {
		    count[pair] = - count[pair] / 2;
	    });
	    
	    goalModel.dependencies.forEach(function (dependency) {
		var source = null
		var target = null
		if (dependency.source != null) {
			if (goal2actor[dependency.source] != null)  {
			    source = goal2actor[dependency.source]
			}
			else
			    source = dependency.source
		}
		if (dependency.target != null) {
			if (goal2actor[dependency.target] != null) 
			    target = goal2actor[dependency.target]
			else
			    target = dependency.target
		}
		if (source != null && target != null) {
			dependency.x = ((source!=null?actors[source].x:0) + ((target!=null)?actors[target].x:0)) / 2 + 1 + 100;
			dependency.y = ((source!=null?actors[source].y:0) + ((target!=null)?actors[target].y:0)) / 2 + 1 + 100 + count[source + "~>" + target] * goalModel.display[dependency.id].height * 2;
			count[source + "~>" + target]--
			max_x = Math.max(max_x, dependency.x + goalModel.display[dependency.id].width);
			max_y = Math.max(max_y, dependency.y + goalModel.display[dependency.id].height);
		}
	    });
    }
    if (goalModel.diagram == null)
      goalModel.diagram = {}
    goalModel.diagram.width = max_x
    goalModel.diagram.height = max_y
}


class Visitor extends iStar2ParserVisitor {
  goalmodel = {};
  stack = [];
  colors = {};

  addDisplay(id, text, is_actor, selected, color) {
    var display_link = {}
    if (this.goalmodel.display == null) {
      this.goalmodel.display = {}
    }
    if (text == null || text.length < 20) {
      display_link.width = 100
      display_link.height = 37
    } else {
      var l = Math.sqrt(text.length / 20.0)
      display_link.width = Math.ceil(100 * l)
      display_link.height = Math.ceil(37 * l)
    }
    if (is_actor) {
      if (selected) {
        display_link.collapsed = false;
      } else {
        display_link.collapsed = true;
      }
    }
    if (color != null) {
      display_link.backgroundColor = "#" + color
    }
    this.goalmodel.display[id] = display_link
  }

  start(ctx) {
    this.goalmodel = this.visitFile_input(ctx);
    var hash_ids = []
    if (this.goalmodel.actors == null) {
      this.goalmodel.actors = []
    }
    for (var i = 0; i < this.goalmodel.actors.length; i++) {
      var actor = this.goalmodel.actors[i]
      hash_ids[actor.id] = uuidv4();
      actor.id = hash_ids[actor.id]
      if (actor.x == null)
        actor.x = 100
      else if (this.goalmodel.diagram != null)
        actor.x -= this.goalmodel.diagram.x - 200;
      if (actor.y == null)
        actor.y = 100
      else if (this.goalmodel.diagram != null)
        actor.y -= this.goalmodel.diagram.y - 64;
      this.addDisplay(actor.id, actor.text, true, actor.selected, actor.color);
      delete actor.selected;
      delete actor.color;
      if (actor.nodes == null) {
        actor.nodes = []
      }
      for (var n = 0; n < actor.nodes.length; n++) {
        var node = actor.nodes[n]
        hash_ids[node.id] = uuidv4();
        node.id = hash_ids[node.id]
        if (node.x == null)
          node.x = 1
        else if (this.goalmodel.diagram != null)
          node.x -= this.goalmodel.diagram.x - 200
        if (node.y == null)
          node.y = 1
        else if (this.goalmodel.diagram != null)
          node.y -= this.goalmodel.diagram.y - 64
        // @FIXME
        // node.customProperties = {"Description": ""}
        // console.log(node.color)
        this.addDisplay(node.id, node.text, false, false, node.color);
        delete node.color;
        if (node.op != null)
          delete node.op
      }
    }
    if (this.goalmodel.dependencies == null) {
      this.goalmodel.dependencies = []
    }
    for (var i = 0; i < this.goalmodel.dependencies.length; i++) {
      var dependency = this.goalmodel.dependencies[i]
      hash_ids[dependency.id] = uuidv4();
      dependency.id = hash_ids[dependency.id]
      if (dependency.x == null)
        dependency.x = 1
      else if (this.goalmodel.diagram != null)
        dependency.x -= this.goalmodel.diagram.x - 200
      if (dependency.y == null)
        dependency.y = 1
      else if (this.goalmodel.diagram != null)
        dependency.y -= this.goalmodel.diagram.y - 64
      this.addDisplay(dependency.id, dependency.text, false, false, null);
    }
    if (this.goalmodel.links == null) {
      this.goalmodel.links = []
    }
    for (var l = 0; l < this.goalmodel.links.length; l++) {
      var link = this.goalmodel.links[l]
      link.id = uuidv4();
      link.source = hash_ids[link.source]
      link.target = hash_ids[link.target]
      this.addDisplay(link.id, link.label, false, false, null);
    }
    for (var i = 0; i < this.goalmodel.dependencies.length; i++) {
      var dependency = this.goalmodel.dependencies[i]
      if (dependency.source != null) {
        // console.log("Problem: the istar2 model is incomplete, you are missing the depender")
        dependency.source = hash_ids[dependency.source]
      }
      if (dependency.target != null) {
        // console.log("Problem: the istar2 model is incomplete, you are missing the dependee")
        dependency.target = hash_ids[dependency.target]
      }
    }
    layout(this.goalmodel);
    return this.goalmodel;
  }

  visitFile_input(ctx) {
    this.goalmodel = [];
    for (let i = 0; i < ctx.getChildCount(); i++) {
      this.visit(ctx.getChild(i));
    }
    return this.goalmodel
  }

  visitChildren(ctx) {
    for (let i = 0; i < ctx.getChildCount(); i++) {
      this.visit(ctx.getChild(i));
    }
  }

  visitTerminal(ctx) {
    return ctx.getText();
  }

  visitColordef(ctx) {
    this.colors[ctx.getChild(1).getText()] = ctx.getChild(2).getText();
  }

  addActor(actor) {
    if (this.goalmodel.actors == null) {
      this.goalmodel.actors = []
    }
    var n = this.goalmodel.actors.length
    this.goalmodel.actors[n] = actor
  }

  visitDiagramdef(ctx) {
    var i = 1;
    var name = "";
    var description = "";
    var found = false;
    this.goalmodel.diagram = {}
    var text = ctx.getChild(i).getText().replace(/\\\\/g, "")
    text = text.substring(0, text.length - 1);
    this.goalmodel.diagram.name = text;
    i += 2;
    this.goalmodel.diagram.customProperties = {}
    text = ctx.getChild(i).getText().replace(/\\\\/g, "")
    text = text.substring(0, text.length - 1);
    this.goalmodel.diagram.customProperties.Description = text
    this.goalmodel.diagram.width = 800
    this.goalmodel.diagram.height = 600
    this.goalmodel.diagram.x = 5000
    this.goalmodel.diagram.y = 5000
  }

  visitActordef(ctx) {
    var lineno = ctx.getChild(0).getText()
    var i = 1;
    var selected = false;
    var color = "CCFACD"; // default
    var found = false;
    var layout = "LR";
    if (this.goalmodel.diagram == null) {
      this.goalmodel.diagram = {}
    }
    do {
      var t = ctx.getChild(i).getSymbol().type
      var s = ctx.parentCtx.parser.symbolicNames[t]
      switch (s) {
        case "SELECTED":
          this.goalmodel.diagram.layout = true
          selected = true; i++; break;
        case "LEFT_RIGHT":
          selected = true;
          layout = "LR";
          this.goalmodel.diagram.layout = true
          i++; break;
        case "TOP_BOTTOM":
          selected = true;
          layout = "TB";
          this.goalmodel.diagram.layout = true
          i++; break;
        case "RGB":
          color = ctx.getChild(i).getText(); i++; break;
        case "INTERNAL":
        case "EXTERNAL":
          if (this.colors[ctx.getChild(i).getText()] != null)
            color = this.colors[ctx.getChild(i).getText()];
          i++; break;
        default:
          found = true;
          break;
      }
    } while (!found);
    var type = ctx.getChild(i).getText()
    var actor = {}
    actor.selected = selected
    if (color != "CCFACD")
      actor.color = color
    actor.type = "istar."
    switch (type) {
      case "actor": actor.type += "Actor"; break;
      case "agent": actor.type += "Agent"; break;
      case "role": actor.type += "Role"; break;
    }
    actor.layout = layout;
    i += 2;
    var text = ctx.getChild(i).getText().replace(/\\\\/g, "")
    i++;
    text = text.substring(0, text.length - 1);
    actor.text = text
    actor.id = lineno
    this.addActor(actor)
    this.stack.push(actor);
    do {
      if (ctx.getChild(i)!=null) {
        var t = ctx.getChild(i).getSymbol().type
        var s = ctx.parentCtx.parser.symbolicNames[t]
        switch (s) {
          case "BEGIN_DESC":
            var text = ctx.getChild(i + 1).getText().replace(/\\\\/g, "");
            text = text.substring(0, text.length - 1);
            if (text != "") {
              actor.customProperties = {}
              actor.customProperties.Description = text;
            }
            i += 2;
            break;
          default:
            found = true;
            break;
        }  
      }
    } while (!found && ctx.getChild(i)!=null);
    for (; i < ctx.getChildCount() - 2; i++) {
      var op = ctx.getChild(i).getText()
      if (op == "is" || op == "in" || op == "~>") {
        var link = {}
        link.source = actor.id
        link.target = parseInt(ctx.getChild(i + 1).getText())
        switch (op) {
          case "~>": link.type = "istar.DependencyLink"; break;
          case 'is': link.type = "istar.IsALink"; link.label = "is a"; break;
          case 'in': link.type = "istar.ParticipatesInLink"; link.label = "participates-in"; break;
        }
        this.addLink(link)
        i++;
      } else if (op == "@") {
        actor.x = parseInt(ctx.getChild(i + 1).getText())
        actor.y = parseInt(ctx.getChild(i + 3).getText())
        if (this.goalmodel.diagram != null && this.goalmodel.display != null) {
          this.goalmodel.diagram.width = Math.max(this.goalmodel.diagram.width, actor.x + this.goalmodel.display[actor.id].width)
          this.goalmodel.diagram.height = Math.max(this.goalmodel.diagram.height, actor.y + this.goalmodel.display[actor.id].height)
          this.goalmodel.diagram.x = Math.min(this.goalmodel.diagram.x, actor.x - 100)
          this.goalmodel.diagram.y = Math.min(this.goalmodel.diagram.y, actor.y - 100)
        }
        i += 3;
      }
    }
    // The last child will be a suite
    var n = ctx.getChildCount();
    var child = ctx.getChild(n - 1);
    if (child != null) {
      this.visitSuite(child);
    }
    this.stack.pop();
  }

  addGoal(goal) {
    if (this.stack.length >= 1) {
      var actor = this.stack[0]
      if (actor.nodes == null) {
        actor.nodes = []
      }
      var n = actor.nodes.length
      actor.nodes[n] = goal
    } else {
      if (this.goalmodel.links == null) {
        this.goalmodel.links = []
      }
      for (var l = 0; l < this.goalmodel.links.length; l++) {
        var link = this.goalmodel.links[l]
        if (link.type == "istar.DependencyLink") {
          if (link.source == goal.id) {
            goal.target = link.target
          }
          if (link.target == goal.id) {
            goal.source = link.source
          }
        }
      }
      if (this.goalmodel.dependencies == null) {
        this.goalmodel.dependencies = []
      }
      var n = this.goalmodel.dependencies.length
      this.goalmodel.dependencies[n] = goal
    }
  }

  addLink(link) {
    if (link.type == "istar.DependencyLink") {
      var goal = this.stack[this.stack.length - 1]
      if (link.source == goal.id) {
        goal.target = link.target
      }
    }
    if (this.goalmodel.links == null) {
      this.goalmodel.links = []
    }
    var n = this.goalmodel.links.length
    this.goalmodel.links[n] = link
  }

  RGBfromYUV(y, u, v) {
    var r = y + 1.4075 * (v - 128);
    var g = y - 0.3455 * (u - 128) - (0.7169 * (v - 128));
    var b = y + 1.7790 * (u - 128);

    r = Math.floor(r);
    g = Math.floor(g);
    b = Math.floor(b);

    r = (r < 0) ? 0 : r;
    r = (r > 255) ? 255 : r;

    g = (g < 0) ? 0 : g;
    g = (g > 255) ? 255 : g;

    b = (b < 0) ? 0 : b;
    b = (b > 255) ? 255 : b;

    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length < 2) { r = "0" + r; }
    if (g.length < 2) { g = "0" + g; }
    if (b.length < 2) { b = "0" + b; }
    return r + g + b;
  }

  toColor(percentage) {
    var Y = 128
    var U = 0
    var V = 256 * (100 - percentage) / 100.0
    return this.RGBfromYUV(Y, U, V)
  }

  visitGoaldef(ctx) {
    var lineno = ctx.getChild(0).getText()
    var i = 1;
    var selected = false;
    var color = "CCFACD"; // default
    var found = false;
    do {
      var t = ctx.getChild(i).getSymbol().type
      var s = ctx.parentCtx.parser.symbolicNames[t]
      switch (s) {
        case "RGB":
          color = ctx.getChild(i).getText(); i++;
          break;
        case "TODO":
        case "DOING":
        case "DONE":
          if (this.colors[ctx.getChild(i).getText()] != null)
            color = this.colors[ctx.getChild(i).getText()];
          i++; break;
        case "DECIMAL_INTEGER":
          var achievement = parseInt(ctx.getChild(i).getText())
          if (ctx.getChild(i + 1).getText() == "%") {
            color = this.toColor(achievement)
          }
          i += 2; break;
        default:
          found = true;
          break;
      }
    } while (!found);
    var type = ctx.getChild(i).getText()
    var goal = {}
    goal.type = "istar."
    switch (type) {
      case "goal": goal.type += "Goal"; break;
      case "task": goal.type += "Task"; break;
      case "resource": goal.type += "Resource"; break;
      case "quality": goal.type += "Quality"; break;
    }
    if (color != "CCFACD")
      goal.color = color
    i += 2;
    var text = ctx.getChild(i).getText().replace(/\\/g, "")
    text = text.substring(0, text.length - 1);
    goal.text = text
    goal.id = lineno
    this.addGoal(goal)
    if (this.stack.length > 0) {
      var parent_op = this.stack[this.stack.length - 1].op;
      if (parent_op == "&" || parent_op == "|") {
        var link = {}
        link.source = goal.id
        link.target = this.stack[this.stack.length - 1].id
        if (parent_op == "&") {
          link.type = "istar.AndRefinementLink"
        } else if (parent_op == "|") {
          link.type = "istar.OrRefinementLink"
        }
        this.addLink(link);
      }
    }
    this.stack.push(goal);
    i++;
    do {
      if (ctx.getChild(i)!=null) {
        var t = ctx.getChild(i).getSymbol().type
        var s = ctx.parentCtx.parser.symbolicNames[t]
        switch (s) {
          case "BEGIN_DESC":
            var text = ctx.getChild(i + 1).getText().replace(/\\\\/g, "");
            text = text.substring(0, text.length - 1);
            if (text != "") {
              // console.log(text);
              goal.customProperties = {}
              goal.customProperties.Description = text;
            }
            i += 2;
            break;
          default:
            found = true;
            break;
        }
        var t = ctx.getChild(i).getSymbol().type
        var s = ctx.parentCtx.parser.symbolicNames[t]
        switch (s) {
          case "BEGIN_DESC":
            var text = ctx.getChild(i + 1).getText().replace(/\\\\/g, "");
            text = text.substring(0, text.length - 1);
            if (text != "") {
              // console.log(text);
              goal.customProperties = {}
              goal.customProperties.Description = text;
            }
            i += 2;
            break;
          default:
            found = true;
            break;
        }    
      }
    } while (!found && ctx.getChild(i)!=null);
    for (; i < ctx.getChildCount() - 2; i++) {
      var op = ctx.getChild(i).getText()
      // console.log(op)
      if (op == "+" || op == "-" || op == "++" || op == "--" || op == "~>" || op == "-o" || op == "~~") {
        var link = {}
        link.source = goal.id
        link.target = parseInt(ctx.getChild(i + 1).getText())
        if (op == "~>") {
          link.type = "istar.DependencyLink";
        } else if (op == "~~") {
          link.type = "istar.QualificationLink";
        } else if (op == "-o") {
          link.type = "istar.NeededByLink";
        } else {
          link.type = "istar.ContributionLink";
          switch (op) {
            case '+': link.label = "help"; break;
            case '++': link.label = "make"; break;
            case '-': link.label = "hurt"; break;
            case '--': link.label = "break"; break;
          }
        }
        this.addLink(link)
        i++;
      } else if (op == "@") {
        goal.x = parseInt(ctx.getChild(i + 1).getText())
        goal.y = parseInt(ctx.getChild(i + 3).getText())
        if (this.goalmodel.diagram != null) {
          this.goalmodel.diagram.width = Math.max(this.goalmodel.diagram.width, goal.x)
          this.goalmodel.diagram.height = Math.max(this.goalmodel.diagram.height, goal.y)
          this.goalmodel.diagram.x = Math.min(this.goalmodel.diagram.x, goal.x)
          this.goalmodel.diagram.y = Math.min(this.goalmodel.diagram.y, goal.y)
        }
        i += 3;
      } else {
        goal.op = op
      }
    }
    // The last child will be a suite
    var n = ctx.getChildCount();
    var child = ctx.getChild(n - 1);
    if (child != null) {
      this.visitSuite(child);
    }
    this.stack.pop();
  }

  visitSuite(ctx) {
    if (ctx == null)
      return;
    if (ctx.getChildCount() > 1) {
      for (var i = 1; i < ctx.getChildCount() - 1; i++) {
        var child = ctx.getChild(i);
        this.visit(child);
      }
    }
  }

};

module.exports = { Visitor, layout };
