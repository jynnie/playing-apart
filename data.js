// jshint esversion:8

// ----------------------------------
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
  constructor(
    id,
    comments = "",
    other = { group: 1, children: [], parents: [], fuzzy: false },
  ) {
    super(id);
    this.comments = comments;

    // Setting the group, 1 = minor, 2 = major
    if (other.group) {
      this.group = other.group;
    } else {
      this.group = 1;
    }

    // If a major, what minor nodes are children
    if (other.children) {
      this.children = other.children;
    } else {
      this.children = [];
    }

    // If a minor, what major node is parent
    if (other.parents) {
      this.parents = other.parents;
    } else {
      this.parents = [];
    }

    // Setting whether fuzzy if this mechanic helps or hurts
    if (other.fuzzy) {
      this.fuzzy = other.fuzzy;
    } else {
      this.fuzzy = false;
    }
  }
  get major() {
    return this.group === 2;
  }
  get distance() {
    if (this.group === 1) {
      return 20;
    } else {
      return 60;
    }
  }
  get strength() {
    if (this.group === 1) {
      return 0.8;
    } else {
      return 0.4;
    }
  }
  setId(i) {
    this.id = i;
  }
  addParent(p) {
    this.parents.push(p);
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
const GIFTING = new Link(
  "gifting",
  "intentionally giving items or notes to another",
);
const EMOTE = new Link(
  "emote",
  "you can emote, it's seen by anyone in the nearby space",
);
const GUIDE = new Link(
  "silent guides",
  "strangers help each other learn and play the game",
);
const FRIENDS = new Link(
  "persisting friends",
  "you can explicitly befriend someone in the system of the game",
);
const SHARED_ITEMS = new Link("shared abandoned items", "", { fuzzy: true });
const SHARED_SIGNS = new Link("shared messages in world", "", { fuzzy: true });
const SHARED_STRUCT = new Link(
  "build things together, crowdsource resources and labor",
);
const ASYMMETRIC = new Link("asymmetric game");
const RATING = new Link("can rate shared things");
const CLEAN_UP = new Link("clean up shared items");
const INVADE_SPACE = new Link("enter another player's game", "", {
  fuzzy: true,
});

// Major links, group 2, these are more thematic
const LONELINESS = new Link(
  "loneliness",
  "on your own, there may be traces of others, but you never meet anyone",
  { group: 2, children: [SINGLE_PLAYER] },
);
const TO_TREASURE = new Link(
  "trash to treasure",
  "the things you don't want, or leave behind, may be useful to others",
  { group: 2, children: [SHARED_ITEMS, GIFTING] },
);
const BABYLON = new Link(
  "awkward",
  "there are barriers to communication with others, be it by curation or by consent systems",
  { group: 2, children: [EMOTE, RATING, SHARED_SIGNS] },
);
const STRANGERS = new Link(
  "stranger intimacy",
  "those that you encounter are most likely to be strangers, and you probably have no say in the matter; but through shared experiences, you make intimate bonds",
  { group: 2, children: [GIFTING, GUIDE] },
);
const GENTLE = new Link(
  "charity",
  "the game asks you to be kind, gentle, and charitable to others, and maybe even rewards it",
  { group: 2, children: [GIFTING, GUIDE] },
);
const PVE = new Link(
  "against the world",
  "it's you against a harsh, unkind world; but maybe there's a stranger on your side",
  { group: 2, children: [ASYMMETRIC] },
);
const CLOSER = new Link(
  "closer",
  "you become more than strangers with others",
  { group: 2, children: [INVADE_SPACE, FRIENDS] },
);
const LIVED_IN = new Link(
  "lived-in",
  "the game world feels lived-in with the contributions of you and others",
  { group: 2, children: [SHARED_SIGNS, SHARED_STRUCT, SHARED_ITEMS, CLEAN_UP] },
);
// const HELP_OR_HURT = new Link(
//   "ambiguous intentions",
//   "it's not clear if what someone has done will help or hurt you",
//   { group: 2, children: [SHARED_SIGNS, SHARED_ITEMS, INVADE_SPACE] },
// );

const MAJOR_LINKS = [
  LONELINESS,
  TO_TREASURE,
  BABYLON,
  STRANGERS,
  GENTLE,
  PVE,
  CLOSER,
  LIVED_IN,
];

const MINOR_LINKS = [
  SINGLE_PLAYER,
  GIFTING,
  EMOTE,
  GUIDE,
  FRIENDS,
  SHARED_ITEMS,
  SHARED_SIGNS,
  SHARED_STRUCT,
  ASYMMETRIC,
  RATING,
  CLEAN_UP,
  INVADE_SPACE,
  // HELP_OR_HURT,
];

const LINKS = [...MAJOR_LINKS, ...MINOR_LINKS];

// List of games with links
const MAJOR_GAMES = [
  new Artifact("Death Stranding", "Kojima Productions", [
    SINGLE_PLAYER,
    SHARED_ITEMS,
    SHARED_SIGNS,
    SHARED_STRUCT,
    CLEAN_UP,
    // HELP_OR_HURT,
    ASYMMETRIC,
    RATING,
  ]),
  new Artifact("Sky", "thatgamecompany", [
    GIFTING,
    SHARED_SIGNS,
    // HELP_OR_HURT,
    EMOTE,
    GUIDE,
    FRIENDS,
  ]),
  new Artifact("Dark Souls", "FromSoftware", [
    SINGLE_PLAYER,
    // HELP_OR_HURT,
    SHARED_SIGNS,
    RATING,
    ASYMMETRIC,
    INVADE_SPACE,
  ]),
  new Artifact("Animal Crossing", "Nintendo", [
    GIFTING,
    SHARED_ITEMS,
    SHARED_SIGNS,
    INVADE_SPACE,
    CLEAN_UP,
    EMOTE,
    FRIENDS,
  ]),
  new Artifact(
    "Kind Words",
    "Popcannibal",
    [SINGLE_PLAYER, GIFTING],
    "a game about writing letters to others",
  ),
  new Artifact("Ashen", "A44", [GUIDE, SHARED_SIGNS, ASYMMETRIC]),
];
