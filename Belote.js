export default class Belote {
  constructor() {
    this.players = ["YOU", "P2", "P3", "P4"];
    this.deck = [];
    this.hands = {};
    this.currentPlayer = 0;
    this.trump = null;
    this.table = [];
    this.trickIndex = 0; // broj odigranih štihova
  }

  startGame() {
    this.createDeck();
    this.shuffleDeck();
    this.dealFirst();

    return this.getState();
  }

  createDeck() {
    const suits = ["♠", "♥", "♦", "♣"];
    const ranks = ["7", "8", "9", "10", "J", "Q", "K", "A"];

    this.deck = [];

    for (const suit of suits) {
      for (const rank of ranks) {
        this.deck.push({ suit, rank });
      }
    }
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealFirst() {
    for (const player of this.players) {
      this.hands[player] = [];
    }

    for (let round = 0; round < 3; round++) {
      for (const player of this.players) {
        const card = this.deck.pop();
        this.hands[player].push(card);
      }
    }
  }

  selectTrump(suit) {
    this.trump = suit;

    // posle izbora aduta ide deljenje ostatka
    this.dealRest();

    return this.getState();
  }

  dealRest() {
    // 2 karte po igraču
    for (let round = 0; round < 2; round++) {
      for (const player of this.players) {
        const card = this.deck.pop();
        this.hands[player].push(card);
      }
    }

    // još 3 karte po igraču
    for (let round = 0; round < 3; round++) {
      for (const player of this.players) {
        const card = this.deck.pop();
        this.hands[player].push(card);
      }
    }
  }

  playCard(player, card) {
    // ❌ NIJE TVOJ RED
    if (this.players[this.currentPlayer] !== player) {
      console.warn(`Not ${player}'s turn`);
      return this.getState();
    }

    // ❌ IGRAČ NEMA TU KARTU
    if (!this.hands[player].includes(card)) {
      console.warn(`${player} does not have card ${card}`);
      return this.getState();
    }

    // 1️⃣ ukloni kartu iz ruke
    this.hands[player] = this.hands[player].filter((c) => c !== card);

    // 2️⃣ stavi kartu na sto
    this.table.push({ player, card });

    // ako su 4 karte → reši štih
    if (this.table.length === 4) {
      this.resolveTrick();
    } else {
      this.nextPlayer();
    }

    return this.getState();
  }

  nextPlayer() {
    this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
  }

  resolveTrick() {
    const leadSuit = this.getCardRank(this.table[0].card).suit;

    let strongest = this.table[0];
    let strongestValue = this.getCardStrength(strongest.card, leadSuit);
  
    for (let i = 1; i < this.table.length; i++) {
      const entry = this.table[i];
      const value = this.getCardStrength(entry.card, leadSuit);

      if (value > strongestValue) {
        strongest = entry;
        strongestValue = value;
      }
    }

    const winner = strongest.player;

    // očisti sto
    this.table = [];

    // pobednik počinje sledeći štih
    this.currentPlayer = this.players.indexOf(winner);

    this.trickIndex++;
  }

  getCardRank(card) {
    // "10♠" → "10", "♠"
    const suit = card.slice(-1);//♠
    const rank = card.slice(0, -1);//10
    return { rank, suit };
  }

  getCardStrength(card, leadSuit) {
    const { rank, suit } = this.getCardRank(card);

    const trumpOrder = ["J", "9", "A", "10", "K", "Q", "8", "7"];
    const normalOrder = ["A", "10", "K", "Q", "J", "9", "8", "7"];

    // adut
    if (suit === this.trump) {
      return 100 + (trumpOrder.length - trumpOrder.indexOf(rank));
    }

    // boja koja se traži
    if (suit === leadSuit) {
      return 50 + (normalOrder.length - normalOrder.indexOf(rank));
    }

    // ostalo
    return 0;
  }

  getState() {
    return {
      currentPlayer: this.players[this.currentPlayer],
      trump: this.trump,
      table: this.table,
      trickIndex: this.trickIndex,
      myHand: this.hands["YOU"],
      opponents: {
        P2: this.hands["P2"].length,
        P3: this.hands["P3"].length,
        P4: this.hands["P4"].length,
      },
      cardsLeftInDeck: this.deck.length,
    };
  }

}


const belote = new Belote();
belote.startGame();
belote.selectTrump("♠");

// ručno nameštamo sto za test
belote.table = [
  { player: "YOU", card: "10♥" },
  { player: "P2",  card: "A♥" },
  { player: "P3",  card: "9♠" },  // adut
  { player: "P4",  card: "K♥" }
];

belote.resolveTrick();

console.log("POBEDNIK:", belote.players[belote.currentPlayer]); // P3
