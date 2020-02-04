// jshint esversion:8

// ----------------------------------
// Graph settings
const COLOR = {
  game: "black",
  minor: "purple",
  major: "orange",
};

const SIZE = {
  game: 25,
  minor: 20,
  major: 40,
};

// ----------------------------------
// Setting up data into links

// Set all the parents of minor links
MAJOR_LINKS.map(l => l.children.map(c => c.addParent(l)));

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

const shape = n => {
  if (n.fuzzy) {
    return d3.symbolTriangle;
  } else {
    return d3.symbolCircle;
  }
};

const size = n => {
  if (n.group === 0) {
    return SIZE.game;
  } else if (n.group === 1) {
    return SIZE.minor;
  } else if (n.group === 2) {
    return SIZE.major;
  }
};

// ----------------------------------
// Draw the graph
const genius = graph => {
  const ticked = () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    // node.attr("x", d => d.x).attr("y", d => d.y);
    node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");

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
    .selectAll("path")
    .data(graph.nodes)
    .enter()
    .append("path")
    .attr(
      "d",
      d3
        .symbol()
        .size(n => size(n))
        .type(n => shape(n)),
    )
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
// If filter on, only show major nodes
let FILTER_ON = false;
const filterNodes = () => {
  // Toggle
  FILTER_ON = !FILTER_ON;

  // Clear previous graph
  svg.selectAll("*").remove();

  // Filter data
  const newLinks = [];
  for (let g of MAJOR_GAMES) {
    let links = new Set([]);
    for (let l of g.links) {
      // If only showing the major links
      if (FILTER_ON && l.parents) {
        // Make a link between the major link and the game
        for (p of l.parents) {
          if (!(p in links)) {
            newLinks.push(p.d3link(g));
            links.add(p);
          }
        }
      } else if (!FILTER_ON) {
        // Make a link between the game on the minor link
        newLinks.push(l.d3link(g));
        // And a link between the minor link and the major
        for (p of l.parents) {
          newLinks.push(l.d3link(p));
        }
      }
    }
  }
  console.log(newLinks);
  const dataLinks = LINKS.filter(l => l.major || !FILTER_ON);

  const newData = {
    nodes: [...MAJOR_GAMES, ...dataLinks],
    links: [...newLinks],
  };
  genius(newData);
};

filterNodes();
