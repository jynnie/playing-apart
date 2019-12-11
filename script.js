// jshint esversion:8

// ----------------------------------
// Declarations

const COLOR = {
  game: "black",
  minor: "purple",
};

// Class declarations
class Node {
  constructor(id, name = null, group = 0) {
    this.id = id;
    this.name = name;
    this.group = group;
    if (name === null) {
      this.name = id;
    }
  }
  d3node(id = null, group = null) {
    // Retroactively set id
    if (id !== null) {
      this.id = id;
    }
    // Retroactively set group
    if (group !== null) {
      this.group = group;
    }
    return { id: this.id, name: this.name, group: this.group };
  }
}

class Artifact extends Node {
  constructor(id, devs = null, links = []) {
    super(id);
    this.links = links;
    this.devs = devs;
  }
}

class Link extends Node {
  constructor(id, comments = "") {
    super(id);
    this.comments = comments;
  }
  d3node(id = null, group = null) {
    // Retroactively set id
    if (id !== null) {
      this.id = id;
    }
    // Retroactively set group
    if (group !== null) {
      this.group = group;
    }
    return {
      id: this.id,
      name: this.name,
      group: this.group,
      comments: this.comments,
    };
  }
}

// ----------------------------------
// Making the data
// Links
const SINGLE_PLAYER = new Link(
  "single player experience",
  "for the majority of the game, if not all of it, you never encounter an embodied player",
);
const MULTIPLAYER = new Link("multiplayer");
const SHARED_ITEMS = new Link("shared abandoned items");
const SHARED_SIGNS = new Link("shared messages in world");
const SHARED_STRUCT = new Link("shared structures and vehicles");
const HELP_OR_HURT = new Link("can help or hurt");
const ASYMMETRIC = new Link("asymmetric game");
const SEND_MESSAGES = new Link("send messages");
const RATING = new Link("can rate shared things");
const CLEAN_UP = new Link("clean up shared items");
const INVADE_SPACE = new Link("enter another player's game");

const LINKS = [
  SINGLE_PLAYER,
  MULTIPLAYER,
  SHARED_ITEMS,
  SHARED_SIGNS,
  SHARED_STRUCT,
  HELP_OR_HURT,
  ASYMMETRIC,
  SEND_MESSAGES,
  RATING,
  CLEAN_UP,
  INVADE_SPACE,
];

// List of games with links
const MAJOR_GAMES = [
  new Artifact(
    "Death Stranding",
    (devs = "Kojima Productions"),
    (links = [
      SINGLE_PLAYER,
      SHARED_ITEMS,
      SHARED_SIGNS,
      SHARED_STRUCT,
      CLEAN_UP,
      HELP_OR_HURT,
      ASYMMETRIC,
      RATING,
    ]),
  ),
  new Artifact(
    "Sky",
    (devs = "thatgamecompany"),
    (links = [MULTIPLAYER, SHARED_SIGNS, HELP_OR_HURT, SEND_MESSAGES]),
  ),
  new Artifact(
    "Dark Souls",
    (devs = "FromSoftware"),
    (links = [
      SINGLE_PLAYER,
      HELP_OR_HURT,
      SHARED_SIGNS,
      RATING,
      ASYMMETRIC,
      INVADE_SPACE,
    ]),
  ),
  new Artifact(
    "Animal Crossing",
    (devs = "Nintendo"),
    (links = [
      SINGLE_PLAYER,
      SHARED_ITEMS,
      SHARED_SIGNS,
      INVADE_SPACE,
      SEND_MESSAGES,
    ]),
  ),
  new Artifact(
    "Kind Words",
    (devs = "Popcannibal"),
    (links = [SINGLE_PLAYER, SEND_MESSAGES]),
  ),
];

// Building data
const gameNodes = MAJOR_GAMES.map(g => g.d3node());
const linkNodes = LINKS.map((l, i) => l.d3node(i, 1));
const d3links = [];
for (let g of MAJOR_GAMES) {
  for (let l of g.links) {
    d3links.push({ source: g.id, target: l.id });
  }
}
const gameData = {
  nodes: [...gameNodes, ...linkNodes],
  links: [...d3links],
};
console.log(gameData);

// ----------------------------------
// Set graph things
const LINK_LENGTH = 60;
const showInfo = d => {
  console.log("help");
  document.getElementById("info").innerText = d.comments;
};

// ----------------------------------
// Creating the graph
// Credit: https://bl.ocks.org/mbostock/2675ff61ea5e063ede2b5d63c08020c7
const svg = d3.select("svg"),
  width = +svg.attr("width"),
  height = +svg.attr("height");

const simulation = d3
  .forceSimulation()
  .force(
    "link",
    d3
      .forceLink()
      .id(d => {
        return d.id;
      })
      .distance(() => LINK_LENGTH),
  )
  .force("charge", d3.forceManyBody().strength(-50))
  .force("center", d3.forceCenter(width / 2, height / 2));

const dragstarted = d => {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
};

const dragged = d => {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
};

const dragended = d => {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
};

const color = g => {
  if (g === 0) {
    return COLOR.game;
  } else {
    return COLOR.minor;
  }
};

const genius = graph => {
  const ticked = () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("cx", d => d.x).attr("cy", d => d.y);

    label.attr("x", d => d.x + 10).attr("y", d => d.y + 5);
    // bgd.attr("x", d => d.x + 10).attr("y", d => d.y + 5);
  };

  const link = svg
    .append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter()
    .append("line");

  const node = svg
    .append("g")
    .attr("class", "nodes")
    .selectAll("circle")
    .data(graph.nodes)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("fill", n => color(n.group))
    .on("mousedown", d => {
      console.log(d);
      showInfo(d);
      d3.event.stopPropagation();
    })
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended),
    );

  node.append("title").text(d => d.name);

  const label = svg
    .append("g")
    .attr("class", "labels")
    .selectAll("text")
    .data(graph.nodes)
    .enter()
    .append("text")
    .text(d => {
      return d.name;
    })
    .attr("x", (_, i) => node._groups[0][i].getAttribute("cx") + 10)
    .attr("y", (_, i) => node._groups[0][i].getAttribute("cy") + 5)
    .attr("class", d => `group-${d.group}`)
    .on("mousedown", d => {
      showInfo(d);
      d3.event.stopPropagation();
    })
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended),
    );

  simulation.nodes(graph.nodes).on("tick", ticked);
  simulation.force("link").links(graph.links);
};

genius(gameData);
