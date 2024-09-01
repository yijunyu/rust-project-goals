# Distributed iStar

This is a customization and adaptation of the piStar tool to support distributed i* Modeling. Its key additional characteristics are:
 - supports a domain specific language (DSL) for iStar 2.0, which allows editing the iStar 2.0 models using any text editor;
 - integrates the graphical i* Modeling tool piStar in a Visual Studio Code-like IDE, so that one can preview the corresponding graphical iStar model;
 - features a transformation of the iStar 2.0 DSL to the grapical iStar 2.0 model used by piStar in JSON format;
 - supports specifying distributed iStar model so that:
    - each actor can model the strategic rationale (SR) in a single DSL file, <actor_name>.istar2; 
    - the strategic dependencies of the actor only needs to specify partially what it depends and what it can be depended on, without directly referring to another agent;
    - the tool composes all the individual actor specifications within the folder by matching the two actors on the same dependums;
    - the composed specification joins the distributed SR + partial SD models into a complete i* model as a single DSL specification;
 - supports automatic as well as interactive layout of i* diagrams:
    - The strategic rationale can be arranged from left-to-right (LR) or from top to bottom (TB), in this way it is easy to see how the AND/OR decompositions hierarchically;
      - Because the width of nodes are usually larger than their heights, LR is more suitable when there are many sibblings in decompositions to save space;
    - The actors with arranged LR/TB layout will then be arranged as a whole with other actors and dependums through a global layout;
    - When the actors are collapsed / expanded, there is no need to move the nodes around to avoid overlaps;
    - Currently there could be some crossings between the dependencies but they can be easily adjusted manually; 

# piStar - online iStar modelling

 This is an open-source goal modelling tool. Its key distinguishing characteristics are:
  - it runs entirely on the browser, thus no installation needed
  - high visual fidelity (we want your diagrams to be pretty, even when printed)
  - supports the [iStar 2.0 standard](https://sites.google.com/site/istarlanguage/)

Currently, this tool is deployed at http://www.cin.ufpe.br/~jhcp/pistar/

Please check out our [requirements doc](docs/REQUIREMENTS.md), our [development instructions](docs/), and our [contributors list](CONTRIBUTORS.md). You can also see the [list of published work that has used this tool](RESEARCH.md).

For further information please contact jhcp at cin ufpe br

## A hackable tool
Feel like getting inside The Matrix? Open your browser's console (usualy ctrl+shift+c) and try one of these examples:

- Add new actors to the model:
```javascript
istar.addActor('Gary');
istar.addAgent('Quinn', {position: {x: 400, y:50}});
```

- Get the content of each element of the model:
```javascript
_.map(istar.getElements(), function(node) { return node.prop('name'); });
```

- Find out if the selected element is a goal (for this you first need to click on an element of the goal model):
```javascript
ui.getSelectedCells()[0].isGoal();
```

- Highlight every neighbor of the selected element (for this you first need to click on an element of the goal model):
```javascript
_.map(istar.graph.getNeighbors(ui.getSelectedCells()[0]), function(node) { istar.paper.findViewByModel(node).highlight(); });
```

## Licensing
This is open-source, you can fork and use it as you see fit. Push requests are very welcome, we will add you to our [contributors list](CONTRIBUTORS.md)!

Of course, the world is a better place when we work together to make it better. So, if you want to extend the tool with some functionality that you think will be useful to others, please get in touch so that we can make it available for everybody. In the future we plan to provide support for plugins, so stay tuned.

## Referencing
If you need to mention the piStar tool, please reference this publication: Pimentel, João and Castro, Jaelson. piStar Tool – A Pluggable Online Tool for Goal Modeling. 2018 IEEE 26th International Requirements Engineering Conference, pp. 498-499.

## Thanks!
 - Thank you very much, developers around the world whom created the awesome libraries we use. This project would be much much harder without them. Especially [JointJS](https://www.jointjs.com/) :heart:
 - Thank you thank you iStar 2.0 language commitee. For the language itself, and for your early support.
