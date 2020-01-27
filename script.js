// jshint esversion:8

// ----------------------------------
// Declarations

const COLOR = {
  game: "black",
  minor: "purple",
  major: "orange",
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
  get charge() {
    return -100;
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
  constructor(id, devs = null, links = [], about = "") {
    super(id);
    this.links = links;
    this.devs = devs;
    this.about = about;
  }
  get charge() {
    return -80;
  }
  get comments() {
    return `${this.devs} - ${this.about}`;
  }
}

class Link extends Node {
  constructor(id, comments = "", group = 1) {
    super(id);
    this.comments = comments;
    this.group = group;
  }
  get major() {
    return this.group === 2;
  }
  get distance() {
    return this.group * 30;
  }
  get strength() {
    if (this.group === 1) {
      return 0.4;
    } else {
      return 0.6;
    }
  }
  setId(i) {
    this.id = i;
  }
  // Given a game, returns d3link information
  d3link(g) {
    return {
      source: g.id,
      target: this.id,
      distance: this.distance,
      strength: this.strength,
    };
  }
}

// ----------------------------------
// Making the data
// Minor links, group 1, these are features
const SINGLE_PLAYER = new Link(
  "single player experience",
  "for the majority of the game, if not all of it, you never encounter an embodied player",
);
const MULTIPLAYER = new Link("multiplayer", "");
const SHARED_ITEMS = new Link("shared abandoned items");
const SHARED_SIGNS = new Link("shared messages in world");
const SHARED_STRUCT = new Link("shared structures and vehicles");
const HELP_OR_HURT = new Link("can help or hurt");
const ASYMMETRIC = new Link("asymmetric game");
const SEND_MESSAGES = new Link("send messages");
const RATING = new Link("can rate shared things");
const CLEAN_UP = new Link("clean up shared items");
const INVADE_SPACE = new Link("enter another player's game");

// Major links, group 2, these are more thematic
const LONELINESS = new Link("loneliness", "", 2);
const TO_TREASURE = new Link(
  "trash to treasure",
  "the things you don't want, or leave behind, may be useful to others",
  2,
);
const BABYLON = new Link(
  "communication barriers",
  "there are barriers to communication with others, be it by curation or by consent systems",
  2,
);
const STRANGERS = new Link(
  "stranger intimacy",
  "those that you encounter are most likely to be strangers, and you probably have no say in the matter; but through shared experiences, you make intimate bonds",
  2,
);
const GENTLE = new Link(
  "gentle",
  "the game asks you to be kind and charitable to others, and maybe even rewards it",
  2,
);
const PVE = new Link(
  "against the world",
  "it's you against a harsh, unkind world; but maybe there's a stranger on your side",
  2,
);

const MAJOR_LINKS = [LONELINESS, TO_TREASURE, BABYLON, STRANGERS, GENTLE, PVE];

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
  ...MAJOR_LINKS,
];

// List of games with links
const MAJOR_GAMES = [
  new Artifact("Death Stranding", "Kojima Productions", [
    SINGLE_PLAYER,
    SHARED_ITEMS,
    SHARED_SIGNS,
    SHARED_STRUCT,
    CLEAN_UP,
    HELP_OR_HURT,
    ASYMMETRIC,
    RATING,

    LONELINESS,
    PVE,
    TO_TREASURE,
  ]),
  new Artifact("Sky", "thatgamecompany", [
    MULTIPLAYER,
    SHARED_SIGNS,
    HELP_OR_HURT,
    SEND_MESSAGES,

    TO_TREASURE,
    GENTLE,
    STRANGERS,
    BABYLON,
  ]),
  new Artifact("Dark Souls", "FromSoftware", [
    SINGLE_PLAYER,
    HELP_OR_HURT,
    SHARED_SIGNS,
    RATING,
    ASYMMETRIC,
    INVADE_SPACE,

    PVE,
    LONELINESS,
  ]),
  new Artifact("Animal Crossing", "Nintendo", [
    SINGLE_PLAYER,
    SHARED_ITEMS,
    SHARED_SIGNS,
    INVADE_SPACE,
    SEND_MESSAGES,
    GENTLE,
  ]),
  new Artifact(
    "Kind Words",
    "Popcannibal",
    [SINGLE_PLAYER, SEND_MESSAGES, STRANGERS, GENTLE],
    "a game about writing letters to others",
  ),
  new Artifact("Ashen", "A44", [BABYLON, STRANGERS, PVE]),
];

// Set all links to a different group, and make id the index
LINKS.map((l, i) => l.setId(i));

// ----------------------------------
// Set graph things
const LINK_LENGTH = 60;
const showInfo = d => {
  document.getElementById("name").innerText = d.name;
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
      .id(d => d.id)
      .strength(d => d.strength)
      .distance(LINK_LENGTH),
  )
  .force(
    "charge",
    d3.forceManyBody().strength(d => d.charge),
  )
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

const color = n => {
  if (n.group === 0) {
    return COLOR.game;
  } else if (n.group === 1) {
    return COLOR.minor;
  } else if (n.group === 2) {
    return COLOR.major;
  }
};

// Draws the graph
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
    .attr("fill", n => color(n))
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

// ----------------------------------
// Graph modifiers

// Builds a new graph by filtering data
let FILTER_ON = false;
const filterNodes = () => {
  // Toggle
  FILTER_ON = !FILTER_ON;

  // Clear previous graph
  svg.selectAll("*").remove();

  // Filter data
  const newLinks = [];
  for (let g of MAJOR_GAMES) {
    for (let l of g.links) {
      if ((FILTER_ON && l.major) || !FILTER_ON) {
        newLinks.push(l.d3link(g));
      }
    }
  }
  const dataLinks = LINKS.filter(l => l.major || !FILTER_ON);

  const newData = {
    nodes: [...MAJOR_GAMES, ...dataLinks],
    links: [...newLinks],
  };
  genius(newData);
};

filterNodes();
