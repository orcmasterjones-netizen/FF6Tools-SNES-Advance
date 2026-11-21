// FF6Tools field definitions adapted for SNES Advance Regular, 2026-11-21. GPL-3.0.
const PROFILE = {
  "tables": {
    "monsters": {
      "name": "Monster stats",
      "start": 3670016,
      "count": 452,
      "width": 32,
      "fields": {
        "hp": {
          "type": "property",
          "name": "HP",
          "begin": 8,
          "mask": "0xFFFF"
        },
        "mp": {
          "type": "property",
          "name": "MP",
          "begin": 10,
          "mask": "0xFFFF"
        },
        "level": {
          "type": "property",
          "name": "Level",
          "begin": 16
        },
        "speed": {
          "type": "property",
          "name": "Speed",
          "begin": 0
        },
        "attackPower": {
          "type": "property",
          "name": "Attack Power",
          "begin": 1
        },
        "hitRate": {
          "type": "property",
          "name": "Hit Rate",
          "begin": 2
        },
        "evade": {
          "type": "property",
          "name": "Evade",
          "begin": 3
        },
        "magicBlock": {
          "type": "property",
          "name": "Magic Block",
          "begin": 4
        },
        "defense": {
          "type": "property",
          "name": "Defense",
          "begin": 5
        },
        "magicDefense": {
          "type": "property",
          "name": "Magic Defense",
          "begin": 6
        },
        "magicPower": {
          "type": "property",
          "name": "Magic Power",
          "begin": 7
        },
        "experience": {
          "type": "property",
          "name": "Experience",
          "begin": 12,
          "mask": "0xFFFF"
        },
        "gp": {
          "type": "property",
          "name": "GP",
          "begin": 14,
          "mask": "0xFFFF"
        }
      },
      "mirror": [
        983040,
        384
      ]
    },
    "loot": {
      "name": "Monster loot",
      "start": 3687644,
      "count": 452,
      "width": 4,
      "fields": {
        "rareSteal": {
          "type": "property",
          "name": "Rare Steal",
          "begin": 0,
          "domain": "loot"
        },
        "commonSteal": {
          "type": "property",
          "name": "Common Steal",
          "begin": 1,
          "domain": "loot"
        },
        "rareDrop": {
          "type": "property",
          "name": "Rare Drop",
          "begin": 2,
          "domain": "loot"
        },
        "commonDrop": {
          "type": "property",
          "name": "Common Drop",
          "begin": 3,
          "domain": "loot"
        }
      },
      "mirror": [
        995328,
        384
      ]
    },
    "formations": {
      "name": "Formations",
      "start": 3154632,
      "count": 645,
      "width": 15,
      "fields": {
        "monster1": {
          "type": "property",
          "name": "Monster 1",
          "begin": 2,
          "max": "0x01FF",
          "msb": "this.parent.monster1MSB",
          "domain": "roster"
        },
        "monster1MSB": {
          "type": "property",
          "name": "Monster 1 MSB",
          "begin": 14,
          "mask": "0x01",
          "bool": true,
          "hidden": true
        },
        "monster1Present": {
          "type": "property",
          "name": "Slot 1 active",
          "begin": 1,
          "mask": "0x01",
          "bool": true
        },
        "monster1X": {
          "type": "property",
          "name": "Slot 1 \u00b7 X (pixels)",
          "begin": 8,
          "mask": "0xF0",
          "multiplier": 8,
          "max": 120
        },
        "monster1Y": {
          "type": "property",
          "name": "Slot 1 \u00b7 Y (pixels)",
          "begin": 8,
          "mask": "0x0F",
          "multiplier": 8,
          "max": 120
        },
        "monster2": {
          "type": "property",
          "name": "Monster 2",
          "begin": 3,
          "max": "0x01FF",
          "msb": "this.parent.monster2MSB",
          "domain": "roster"
        },
        "monster2MSB": {
          "type": "property",
          "name": "Monster 2 MSB",
          "begin": 14,
          "mask": "0x02",
          "bool": true,
          "hidden": true
        },
        "monster2Present": {
          "type": "property",
          "name": "Slot 2 active",
          "begin": 1,
          "mask": "0x02",
          "bool": true
        },
        "monster2X": {
          "type": "property",
          "name": "Slot 2 \u00b7 X (pixels)",
          "begin": 9,
          "mask": "0xF0",
          "multiplier": 8,
          "max": 120
        },
        "monster2Y": {
          "type": "property",
          "name": "Slot 2 \u00b7 Y (pixels)",
          "begin": 9,
          "mask": "0x0F",
          "multiplier": 8,
          "max": 120
        },
        "monster3": {
          "type": "property",
          "name": "Monster 3",
          "begin": 4,
          "max": "0x01FF",
          "msb": "this.parent.monster3MSB",
          "domain": "roster"
        },
        "monster3MSB": {
          "type": "property",
          "name": "Monster 3 MSB",
          "begin": 14,
          "mask": "0x04",
          "bool": true,
          "hidden": true
        },
        "monster3Present": {
          "type": "property",
          "name": "Slot 3 active",
          "begin": 1,
          "mask": "0x04",
          "bool": true
        },
        "monster3X": {
          "type": "property",
          "name": "Slot 3 \u00b7 X (pixels)",
          "begin": 10,
          "mask": "0xF0",
          "multiplier": 8,
          "max": 120
        },
        "monster3Y": {
          "type": "property",
          "name": "Slot 3 \u00b7 Y (pixels)",
          "begin": 10,
          "mask": "0x0F",
          "multiplier": 8,
          "max": 120
        },
        "monster4": {
          "type": "property",
          "name": "Monster 4",
          "begin": 5,
          "max": "0x01FF",
          "msb": "this.parent.monster4MSB",
          "domain": "roster"
        },
        "monster4MSB": {
          "type": "property",
          "name": "Monster 4 MSB",
          "begin": 14,
          "mask": "0x08",
          "bool": true,
          "hidden": true
        },
        "monster4Present": {
          "type": "property",
          "name": "Slot 4 active",
          "begin": 1,
          "mask": "0x08",
          "bool": true
        },
        "monster4X": {
          "type": "property",
          "name": "Slot 4 \u00b7 X (pixels)",
          "begin": 11,
          "mask": "0xF0",
          "multiplier": 8,
          "max": 120
        },
        "monster4Y": {
          "type": "property",
          "name": "Slot 4 \u00b7 Y (pixels)",
          "begin": 11,
          "mask": "0x0F",
          "multiplier": 8,
          "max": 120
        },
        "monster5": {
          "type": "property",
          "name": "Monster 5",
          "begin": 6,
          "max": "0x01FF",
          "msb": "this.parent.monster5MSB",
          "domain": "roster"
        },
        "monster5MSB": {
          "type": "property",
          "name": "Monster 5 MSB",
          "begin": 14,
          "mask": "0x10",
          "bool": true,
          "hidden": true
        },
        "monster5Present": {
          "type": "property",
          "name": "Slot 5 active",
          "begin": 1,
          "mask": "0x10",
          "bool": true
        },
        "monster5X": {
          "type": "property",
          "name": "Slot 5 \u00b7 X (pixels)",
          "begin": 12,
          "mask": "0xF0",
          "multiplier": 8,
          "max": 120
        },
        "monster5Y": {
          "type": "property",
          "name": "Slot 5 \u00b7 Y (pixels)",
          "begin": 12,
          "mask": "0x0F",
          "multiplier": 8,
          "max": 120
        },
        "monster6": {
          "type": "property",
          "name": "Monster 6",
          "begin": 7,
          "max": "0x01FF",
          "msb": "this.parent.monster6MSB",
          "domain": "roster"
        },
        "monster6MSB": {
          "type": "property",
          "name": "Monster 6 MSB",
          "begin": 14,
          "mask": "0x20",
          "bool": true,
          "hidden": true
        },
        "monster6Present": {
          "type": "property",
          "name": "Slot 6 active",
          "begin": 1,
          "mask": "0x20",
          "bool": true
        },
        "monster6X": {
          "type": "property",
          "name": "Slot 6 \u00b7 X (pixels)",
          "begin": 13,
          "mask": "0xF0",
          "multiplier": 8,
          "max": 120
        },
        "monster6Y": {
          "type": "property",
          "name": "Slot 6 \u00b7 Y (pixels)",
          "begin": 13,
          "mask": "0x0F",
          "multiplier": 8,
          "max": 120
        }
      },
      "mirror": [
        1008128,
        576
      ]
    },
    "items": {
      "name": "Item properties",
      "start": 3539561,
      "count": 271,
      "width": 30,
      "fields": {
        "cost": {
          "type": "property",
          "name": "Cost",
          "begin": 28,
          "mask": "0xFFFF"
        },
        "power": {
          "type": "property",
          "name": "Power / defense",
          "begin": 20
        },
        "accuracy": {
          "type": "property",
          "name": "Hit rate / magic defense",
          "begin": 21
        },
        "equip0": {
          "type": "property",
          "name": "Terra",
          "begin": 1,
          "mask": 1,
          "bool": true
        },
        "equip1": {
          "type": "property",
          "name": "Locke",
          "begin": 1,
          "mask": 2,
          "bool": true
        },
        "equip2": {
          "type": "property",
          "name": "Cyan",
          "begin": 1,
          "mask": 4,
          "bool": true
        },
        "equip3": {
          "type": "property",
          "name": "Shadow",
          "begin": 1,
          "mask": 8,
          "bool": true
        },
        "equip4": {
          "type": "property",
          "name": "Edgar",
          "begin": 1,
          "mask": 16,
          "bool": true
        },
        "equip5": {
          "type": "property",
          "name": "Sabin",
          "begin": 1,
          "mask": 32,
          "bool": true
        },
        "equip6": {
          "type": "property",
          "name": "Celes",
          "begin": 1,
          "mask": 64,
          "bool": true
        },
        "equip7": {
          "type": "property",
          "name": "Strago",
          "begin": 1,
          "mask": 128,
          "bool": true
        },
        "equip8": {
          "type": "property",
          "name": "Relm",
          "begin": 2,
          "mask": 1,
          "bool": true
        },
        "equip9": {
          "type": "property",
          "name": "Setzer",
          "begin": 2,
          "mask": 2,
          "bool": true
        },
        "equip10": {
          "type": "property",
          "name": "Mog",
          "begin": 2,
          "mask": 4,
          "bool": true
        },
        "equip11": {
          "type": "property",
          "name": "Gau",
          "begin": 2,
          "mask": 8,
          "bool": true
        },
        "equip12": {
          "type": "property",
          "name": "Gogo",
          "begin": 2,
          "mask": 16,
          "bool": true
        },
        "equip13": {
          "type": "property",
          "name": "Umaro",
          "begin": 2,
          "mask": 32,
          "bool": true
        }
      },
      "mirror": [
        1593344,
        256
      ]
    },
    "espers": {
      "name": "Esper learning",
      "start": 1601024,
      "count": 31,
      "width": 11,
      "fields": {
        "spell1": {
          "type": "property",
          "name": "Spell 1",
          "begin": 1,
          "domain": "teaching"
        },
        "rate1": {
          "type": "property",
          "name": "Rate 1",
          "begin": 0,
          "max": 100
        },
        "spell2": {
          "type": "property",
          "name": "Spell 2",
          "begin": 3,
          "domain": "teaching"
        },
        "rate2": {
          "type": "property",
          "name": "Rate 2",
          "begin": 2,
          "max": 100
        },
        "spell3": {
          "type": "property",
          "name": "Spell 3",
          "begin": 5,
          "domain": "teaching"
        },
        "rate3": {
          "type": "property",
          "name": "Rate 3",
          "begin": 4,
          "max": 100
        },
        "spell4": {
          "type": "property",
          "name": "Spell 4",
          "begin": 7,
          "domain": "teaching"
        },
        "rate4": {
          "type": "property",
          "name": "Rate 4",
          "begin": 6,
          "max": 100
        },
        "spell5": {
          "type": "property",
          "name": "Spell 5",
          "begin": 9,
          "domain": "teaching"
        },
        "rate5": {
          "type": "property",
          "name": "Rate 5",
          "begin": 8,
          "max": 100
        },
        "bonus": {
          "type": "property",
          "name": "Bonus",
          "begin": 10,
          "domain": "bonus"
        }
      }
    },
    "magic": {
      "name": "Player magic",
      "start": 289472,
      "count": 54,
      "width": 14,
      "fields": {
        "mpCost": {
          "type": "property",
          "name": "MP Cost",
          "begin": 5
        },
        "spellPower": {
          "type": "property",
          "name": "Spell Power",
          "begin": 6
        },
        "hitRate": {
          "type": "property",
          "name": "Hit Rate",
          "begin": 8
        }
      }
    },
    "addedMagic": {
      "name": "Added player magic",
      "start": 3152010,
      "count": 3,
      "width": 14,
      "fields": {
        "mpCost": {
          "type": "property",
          "name": "MP Cost",
          "begin": 5
        },
        "spellPower": {
          "type": "property",
          "name": "Spell Power",
          "begin": 6
        },
        "hitRate": {
          "type": "property",
          "name": "Hit Rate",
          "begin": 8
        }
      }
    },
    "summons": {
      "name": "Summon attacks",
      "start": 290228,
      "count": 27,
      "width": 14,
      "fields": {
        "mpCost": {
          "type": "property",
          "name": "MP Cost",
          "begin": 5
        },
        "spellPower": {
          "type": "property",
          "name": "Spell Power",
          "begin": 6
        },
        "hitRate": {
          "type": "property",
          "name": "Hit Rate",
          "begin": 8
        }
      }
    },
    "addedSummons": {
      "name": "Added summon attacks",
      "start": 3151912,
      "count": 7,
      "width": 14,
      "fields": {
        "mpCost": {
          "type": "property",
          "name": "MP Cost",
          "begin": 5
        },
        "spellPower": {
          "type": "property",
          "name": "Spell Power",
          "begin": 6
        },
        "hitRate": {
          "type": "property",
          "name": "Hit Rate",
          "begin": 8
        }
      }
    },
    "maps": {
      "name": "Map properties",
      "start": 3287446,
      "count": 431,
      "width": 33,
      "fields": {
        "song": {
          "type": "property",
          "name": "Song",
          "begin": 28,
          "domain": "song"
        },
        "enableBattles": {
          "type": "property",
          "name": "Enable Battles",
          "begin": 5,
          "mask": "0x80",
          "bool": true
        },
        "layout1": {
          "type": "property",
          "name": "Tile Layout",
          "begin": 13,
          "mask": "0x03FF",
          "readOnly": true
        },
        "layout2": {
          "type": "property",
          "name": "Tile Layout",
          "begin": 14,
          "mask": "0x0FFC",
          "readOnly": true
        },
        "layout3": {
          "type": "property",
          "name": "Tile Layout",
          "begin": 15,
          "mask": "0x3FF0",
          "readOnly": true
        }
      }
    }
  },
  "char": {
    "128": "A",
    "129": "B",
    "130": "C",
    "131": "D",
    "132": "E",
    "133": "F",
    "134": "G",
    "135": "H",
    "136": "I",
    "137": "J",
    "138": "K",
    "139": "L",
    "140": "M",
    "141": "N",
    "142": "O",
    "143": "P",
    "144": "Q",
    "145": "R",
    "146": "S",
    "147": "T",
    "148": "U",
    "149": "V",
    "150": "W",
    "151": "X",
    "152": "Y",
    "153": "Z",
    "154": "a",
    "155": "b",
    "156": "c",
    "157": "d",
    "158": "e",
    "159": "f",
    "160": "g",
    "161": "h",
    "162": "i",
    "163": "j",
    "164": "k",
    "165": "l",
    "166": "m",
    "167": "n",
    "168": "o",
    "169": "p",
    "170": "q",
    "171": "r",
    "172": "s",
    "173": "t",
    "174": "u",
    "175": "v",
    "176": "w",
    "177": "x",
    "178": "y",
    "179": "z",
    "180": "0",
    "181": "1",
    "182": "2",
    "183": "3",
    "184": "4",
    "185": "5",
    "186": "6",
    "187": "7",
    "188": "8",
    "189": "9",
    "190": "!",
    "191": "?",
    "192": "/",
    "193": ":",
    "194": "\u201d",
    "195": "\u2019",
    "196": "-",
    "197": ".",
    "198": ",",
    "199": "\u2026",
    "200": ";",
    "201": "#",
    "202": "+",
    "203": "(",
    "204": ")",
    "205": "%",
    "206": "~",
    "210": "=",
    "255": " ",
    "254": " "
  },
  "song": {
    "0": "Silence",
    "1": "The Prelude",
    "2": "Opening Theme 1",
    "3": "Opening Theme 2",
    "4": "Opening Theme 3",
    "5": "Awakening",
    "6": "Terra",
    "7": "Shadow",
    "8": "Strago",
    "9": "Gau",
    "10": "Edgar & Sabin",
    "11": "Coin Song",
    "12": "Cyan",
    "13": "Locke",
    "14": "Forever Rachel",
    "15": "Relm",
    "16": "Setzer",
    "17": "Epitaph",
    "18": "Celes",
    "19": "Techno de Chocobo",
    "20": "The Decisive Battle",
    "21": "Johnny C. Bad",
    "22": "Kefka",
    "23": "The Mines of Narshe",
    "24": "Phantom Forest",
    "25": "Veldt",
    "26": "Save Them!",
    "27": "The Emperor Gestahl",
    "28": "Troops March On",
    "29": "Under Martial Law",
    "30": "Waterfall",
    "31": "Metamorphosis",
    "32": "Phantom Train",
    "33": "Another World of Beasts",
    "34": "Grand Finale 2",
    "35": "Mt. Kolts",
    "36": "Battle Theme",
    "37": "Fanfare",
    "38": "The Wedding Waltz 1",
    "39": "Aria de Mezzo Caraterre",
    "40": "The Serpent Trench",
    "41": "Slam Shuffle",
    "42": "Kids Run Through the City Corner",
    "43": "???",
    "44": "Grand Finale 1",
    "45": "Gogo",
    "46": "Returners",
    "47": "Fanfare",
    "48": "Umaro",
    "49": "Mog",
    "50": "The Unforgiven",
    "51": "The Fierce Battle",
    "52": "The Day After",
    "53": "Blackjack",
    "54": "Catastrophe",
    "55": "The Magic House",
    "56": "Nighty Night",
    "57": "Wind",
    "58": "Windy Shores",
    "59": "Dancing Mad 1, 2 & 3",
    "60": "Train Braking",
    "61": "Spinach Rag",
    "62": "Rest in Piece",
    "63": "Chocobos Running",
    "64": "The Dream of a Train",
    "65": "Overture 1",
    "66": "Overture 2",
    "67": "Overture 3",
    "68": "The Wedding Waltz 1",
    "69": "The Wedding Waltz 2",
    "70": "The Wedding Waltz 3",
    "71": "Devil's Lab",
    "72": "Fire!/Explosion",
    "73": "Cranes Rising",
    "74": "Inside the Burning House",
    "75": "New Continent",
    "76": "Searching for Friends",
    "77": "Fanatics",
    "78": "Last Dungeon and Aura",
    "79": "Dark World",
    "80": "Dancing Mad 5",
    "81": "Silence",
    "82": "Dancing Mad 4",
    "83": "Ending Theme 1",
    "84": "Ending Theme 2"
  },
  "mapNames": {
    "0": "World of Balance",
    "1": "World of Ruin",
    "2": "Serpent Trench",
    "3": "Empty",
    "4": "Empty (Shadow's Dream)",
    "5": "Empty (Mog Narration)",
    "6": "Blackjack: Exterior",
    "7": "Blackjack: Interior",
    "8": "Blackjack: Parlor",
    "9": "Blank Map (3 Scenarios)",
    "10": "Blackjack: Exterior (Cutscenes)",
    "11": "Falcon: Exterior",
    "12": "Falcon: Interior",
    "13": "Blackjack: Exterior (Breaking Apart)",
    "14": "Chocobo Stable: Exterior (WoB)",
    "15": "Chocobo Stable: Interior",
    "16": "Chocobo Stable: Exterior (WoR)",
    "17": "Falcon: Exterior (Cutscenes)",
    "18": "Narshe: Mountaintop (Intro)",
    "19": "Narshe: South Exterior (Intro)",
    "20": "Narshe: South Exterior (WoB)",
    "21": "Narshe: North Exterior (WoB)",
    "22": "Narshe: Hills Maze (WoB)",
    "23": "Narshe: Cliffs (WoB)",
    "24": "Narshe: Weapon Shop",
    "25": "Narshe: Armor Shop",
    "26": "Narshe: Item Shop",
    "27": "Narshe: Relic Shop",
    "28": "Narshe: Inn",
    "29": "Narshe: Cafe",
    "30": "Narshe: Other Rooms",
    "31": "Narshe: Chocobo Stable",
    "32": "Narshe: South Exterior (WoR)",
    "33": "Narshe: North Exterior (WoR)",
    "34": "Narshe: Hills Maze (WoR)",
    "35": "Narshe: Cliffs (WoR)",
    "36": "Narshe: North Caves (WoR)",
    "37": "Narshe: 3-Party Cave (WoR)",
    "38": "Narshe: South Caves (WoR)",
    "39": "Narshe: North Exterior (Intro)",
    "40": "Narshe: Caves (Unused)",
    "41": "Narshe: Whelk Cave (Intro)",
    "42": "Narshe: Tritoch's Cave (Intro)",
    "43": "Narshe: Tritoch's Cave (WoB)",
    "44": "Narshe: Moogle Cave (WoR)",
    "47": "South Figaro: Exterior (Sneaking Out)",
    "48": "Narshe: Cave to Checkpoint (WoB)",
    "49": "Narshe: Checkpoint Cave (WoB)",
    "50": "Narshe: South Caves (WoB)",
    "51": "Narshe: 3-Party Cave (WoB)",
    "52": "Narshe: Moogle Cave (WoB)",
    "53": "Cave to South Figaro: Siegfried's Tunnel",
    "54": "Figaro Castle: Submerging",
    "55": "Figaro Castle: Exterior",
    "56": "Figaro Castle: Empty Desert",
    "57": "Figaro Castle: West Tower",
    "58": "Figaro Castle: Throne Room",
    "59": "Figaro Castle: Other Rooms",
    "60": "Figaro Castle: Library",
    "61": "Figaro Castle: Switch Room and Prison",
    "62": "Figaro Castle: Upper Basement",
    "63": "Figaro Castle: Lower Basement",
    "64": "Figaro Castle: Engine Room",
    "65": "Figaro Castle: Treasury",
    "66": "Figaro Castle: Basement Treasure Room",
    "67": "Figaro Castle: Night Time",
    "68": "Cave to South Figaro (WoR)",
    "69": "Cave to South Figaro (Locke/Celes)",
    "70": "Cave to South Figaro: Turtle Room (Locke/Celes)",
    "71": "Cave to South Figaro: Outside",
    "72": "Cave to South Figaro (Terra/Locke/Edgar)",
    "73": "Cave to South Figaro: Turtle Room (Terra/Locke/Edgar)",
    "74": "South Figaro: Exterior (WoR)",
    "75": "South Figaro: Exterior (WoB)",
    "76": "South Figaro: Inn/Relic Shop",
    "77": "South Figaro: Arsenal",
    "78": "South Figaro: Cafe",
    "79": "South Figaro: Unused",
    "80": "South Figaro: Chocobo Stable",
    "81": "South Figaro: Rich Man's House",
    "82": "South Figaro: Interior (Unused)",
    "83": "South Figaro: Basement",
    "84": "South Figaro: Clock Room",
    "85": "South Figaro: Item Shop",
    "86": "South Figaro: Other Rooms",
    "87": "South Figaro: Escape Tunnel",
    "88": "South Figaro: Basement Save Point",
    "89": "South Figaro: Basement Treasure Rooms",
    "90": "Cave to South Figaro: Turtle Room (WoR)",
    "91": "South Figaro: Docks",
    "92": "South Figaro: Cave Behind Turtle",
    "93": "Sabin's House: Exterior",
    "94": "Sabin's House: Interior",
    "95": "Mt. Kolts: Entrance",
    "96": "Mt. Kolts: Lower Exterior",
    "97": "Mt. Kolts: Upper Exterior",
    "98": "Mt. Kolts: Vargas' Area",
    "99": "Mt. Kolts: Unused",
    "100": "Mt. Kolts: Interior",
    "101": "Mt. Kolts: Exit",
    "102": "Mt. Kolts: Back Side Exterior",
    "103": "Mt. Kolts: Save Point",
    "104": "Narshe: Beginner's House (main room)",
    "105": "Narshe: Beginner's House (left room)",
    "106": "Narshe: Beginner's House (middle room)",
    "107": "Narshe: Beginner's House (right room)",
    "108": "Returner's Hideout: Entrance",
    "109": "Returner's Hideout: Main Room",
    "110": "Returner's Hideout: Other Rooms",
    "111": "Returner's Hideout: Inn",
    "112": "Returner's Hideout: Tunnel to Lete River",
    "113": "Lete River: Exterior",
    "114": "Lete River: Caves",
    "115": "Crazy Old Man's House: Exterior (WoB)",
    "116": "Crazy Old Man's House: Interior",
    "117": "Imperial Camp: On Foot",
    "119": "Imperial Camp: Magitek Armor",
    "120": "Doma Castle: Exterior (Imperial Siege)",
    "121": "Doma Castle: Exterior (Poisoning)",
    "123": "Doma Castle: Interior",
    "124": "Doma Castle: Cyan's Room",
    "125": "Doma Castle: Exterior (Cyan's Dream)",
    "126": "Doma Castle: Interior (Cyan's Dream)",
    "127": "Duncan's House: Exterior",
    "128": "Duncan's House: Interior",
    "129": "Mountaintop (Ending)",
    "130": "Phantom Forest (Ending)",
    "131": "Crazy Old Man's House: Exterior (WoR)",
    "132": "Phantom Forest: Main Area",
    "133": "Phantom Forest: Recovery Spring",
    "134": "Phantom Forest: Fork",
    "135": "Phantom Forest: Path to Phantom Train",
    "136": "Mountain Waterfall (Ending)",
    "137": "Phantom Train: Platform (After Train Leaves)",
    "138": "Phantom Train: Platform (Party Gets Off)",
    "139": "Phantom Train: Platform (Dead People Get On)",
    "140": "Phantom Train: Platform (Party Gets On)",
    "141": "Phantom Train: Exterior (Front Cars)",
    "142": "Phantom Train: Exterior (Rear Cars)",
    "143": "Phantom Train: Exterior (Cyan's Dream)",
    "144": "Phantom Train: 2nd Train Car (Cyan's Dream)",
    "145": "Phantom Train: Seating Cars",
    "146": "Phantom Train: Caboose Room and Engine Room",
    "147": "Phantom Train: Dining Car",
    "148": "Mobliz: Exterior (Light of Judgement)",
    "149": "Phantom Train: Seating Car with Switch",
    "150": "Mobliz: Cave 2",
    "151": "Phantom Train: Hallway",
    "152": "Phantom Train: Caboose",
    "153": "Phantom Train: Small Rooms",
    "154": "Mobliz: Cave 1",
    "155": "Baren Falls: Interior",
    "156": "Baren Falls: Exterior",
    "157": "Mobliz: Exterior (WoB)",
    "158": "Mobliz: Exterior (WoR)",
    "159": "Baren Falls: Riverbank",
    "160": "Mobliz: Inn",
    "161": "Mobliz: Arsenal",
    "162": "Mobliz: Relic Shop",
    "163": "Mobliz: Mail House",
    "164": "Mobliz: Item Shop",
    "165": "Mobliz: Other Rooms",
    "166": "Baren Falls: Entrance",
    "167": "Crescent Mountain: Interior",
    "168": "Crescent Mountain: Exterior",
    "169": "Nikeah: Exterior",
    "170": "Baren Falls: Riverbank (Shadow's Dream)",
    "171": "Nikeah: Inn",
    "172": "Nikeah: Cafe",
    "173": "Nikeah: Chocobo Stable",
    "174": "Phantom Forest (Shadow's Dream)",
    "175": "Serpent Trench: Caves",
    "176": "Mt. Zozo: Bridge",
    "177": "Mt. Zozo: Treasure Cliff",
    "178": "Mt. Zozo: Cliff to Cyan's Cave",
    "179": "Mt. Zozo: Interior",
    "180": "Mt. Zozo: Cyan's Cave",
    "181": "Mt. Zozo: Cyan's Cliff",
    "182": "Thamasa: Exterior (Shadow's Dream)",
    "183": "Mobliz: Cave 1 (Ending)",
    "184": "Mobliz: Exterior (Ending)",
    "185": "Colosseum Guy's House: Exterior",
    "186": "Colosseum Guy's House: Interior",
    "187": "Nikeah: Docks",
    "188": "Kohlingen: Exterior (WoB)",
    "189": "Kohlingen: Exterior (WoR)",
    "190": "Lete River: Exterior (Ending)",
    "191": "Kohlingen: Inn",
    "192": "Kohlingen: Unused",
    "193": "Kohlingen: Unused",
    "194": "Kohlingen: General Store",
    "195": "Kohlingen: Crazy Man's House",
    "196": "Maranda: Lola's House",
    "197": "Kohlingen: Rachel's House",
    "198": "Jidoor: Exterior",
    "200": "Jidoor: Auction House",
    "201": "Jidoor: Item Shop",
    "202": "Jidoor: Relic Shop",
    "203": "Jidoor: Armor Shop",
    "204": "Jidoor: Weapon Shop",
    "205": "Jidoor: Chocobo Stable",
    "206": "Jidoor: Inn",
    "207": "Jidoor: Owzer's Basement",
    "208": "Jidoor: Chadarnook's Room",
    "209": "Jidoor: Owzer's House",
    "210": "Doma Castle: Exterior (Ending)",
    "211": "Narshe: Cliffs (Ending)",
    "212": "Gogo's Cave: Bridges (Ending)",
    "213": "Crescent Mountain: Interior (Ending)",
    "214": "Mt. Zozo: Bridge (Setzer/Darill Flashback)",
    "215": "Blank (Falcon Flying Off)",
    "216": "Esper World: Doors Closing",
    "217": "Esper World: Exterior",
    "218": "Esper World: Cave to Exit",
    "219": "Esper World: Interior",
    "220": "South Figaro: Docks (Unused)",
    "221": "Zozo: Exterior",
    "225": "Zozo: Interior",
    "226": "Zozo: Ramuh's Room",
    "231": "Opera House: Theater (WoR)",
    "232": "Opera House: Backstage (Before Opera)",
    "233": "Opera House: Stage (Fight Scene)",
    "234": "Opera House: Stage (Intro)",
    "235": "Opera House: Stage (Catwalk)",
    "236": "Opera House: Castle",
    "237": "Opera House: Lobby",
    "238": "Opera House: Backstage (During Opera)",
    "239": "Opera House: Stage (Lights Out)",
    "240": "Vector: Town Exterior (After Train Ride)",
    "241": "Vector: Upper Castle Exterior (Cranes)",
    "242": "Vector: Town Exterior",
    "243": "Vector: Lower Castle Exterior",
    "244": "Vector: Upper Castle Exterior",
    "245": "Vector: Inn",
    "246": "Vector: Weapon Shop",
    "247": "Vector: Cafe",
    "248": "Vector: Armor Shop",
    "249": "Vector: Tiny House",
    "250": "Vector: Castle Interior",
    "251": "Vector: Castle Dining Room",
    "252": "Vector: Castle Barracks",
    "253": "Vector: Town Exterior (On Fire)",
    "262": "Magitek Factory: Upper Room",
    "263": "Magitek Factory: Lower Room",
    "264": "Magitek Factory: Garbage Room",
    "265": "Magitek Factory: Unused",
    "266": "Magitek Research Facility: Elevator",
    "267": "Kefka's Tower: Stairway (Unused)",
    "268": "Magitek Research Facility: Tube Room (Ending)",
    "269": "Magitek Research Facility: Stairway",
    "270": "Magitek Factory: Save Point",
    "271": "Magitek Research Facility: Tube Room",
    "272": "Magitek Research Facility: Train Room",
    "273": "Magitek Research Facility: Number 024's Room",
    "274": "Magitek Research Facility: Esper Room",
    "275": "Unused",
    "276": "Gogo's Cave: First 3 Rooms",
    "277": "Gogo's Cave: Short Tunnel",
    "278": "Gogo's Cave: Gogo's Room",
    "279": "Gogo's Cave: Save Point",
    "280": "Gogo's Cave: Last 2 Rooms",
    "281": "Umaro's Cave: Other Caves",
    "282": "Umaro's Cave: Second Cave",
    "283": "Umaro's Cave: Umaro's Room",
    "284": "Maranda: Exterior",
    "285": "Doma Castle: Exterior (WoB)",
    "287": "Kefka's Tower: After Guardian",
    "288": "Maranda: Inn",
    "289": "Maranda: Weapon Shop",
    "290": "Maranda: Armor Shop",
    "291": "Kefka's Tower: Guardian's Room",
    "292": "Kefka's Tower: Small Switch Room",
    "293": "Kefka's Tower",
    "294": "Kefka's Tower: Before Gold Dragon",
    "295": "Kefka's Tower: Before Tube Room",
    "296": "Kefka's Tower: Inferno's Room (Upstairs)",
    "297": "Darill's Tomb: Entrance",
    "298": "Darill's Tomb: First Room",
    "299": "Darill's Tomb: Upstairs",
    "300": "Darill's Tomb: Downstairs",
    "301": "Darill's Tomb: Stairway",
    "302": "Thamasa: Exterior (Ending)",
    "303": "Kefka's Tower",
    "304": "Kefka's Tower: Fixed Dice Room",
    "305": "Tzen: Exterior (WoR)",
    "306": "Tzen: Exterior (WoB)",
    "307": "Tzen: Item Shop",
    "308": "Tzen: Inn",
    "309": "Tzen: Weapon Shop",
    "310": "Tzen: Armor Shop",
    "311": "Tzen: Collapsing House",
    "312": "Tzen: Relic Shop",
    "313": "Phoenix Cave: Downstairs",
    "314": "Phoenix Cave: Downstairs (?)",
    "315": "Phoenix Cave: Upstairs",
    "316": "Phoenix Cave: Upstairs (?)",
    "317": "Cyan's Dream: 3 Stooges",
    "318": "Phoenix Cave: Entrance",
    "319": "Cyan's Dream: Cliffs",
    "320": "Cyan's Dream: Caves",
    "321": "Phantom Train: Third Train Car (Cyan's Dream)",
    "322": "Phantom Train: First Train Car (Cyan's Dream)",
    "323": "Albrook: Exterior (WoB)",
    "324": "Albrook: Exterior (WoR)",
    "325": "Albrook: Inn",
    "326": "Albrook: Weapon Shop",
    "327": "Albrook: Armor Shop",
    "328": "Albrook: Item Shop",
    "329": "Kefka's Tower",
    "330": "Albrook: Cafe/Relic Shop",
    "331": "Kefka's Tower: Atma's Room",
    "332": "Albrook: Docks",
    "334": "Kefka's Tower: Exterior",
    "335": "Kefka's Tower: Gold Dragon's Room",
    "336": "Kefka's Tower",
    "337": "Kefka's Tower: Lower Switch Room",
    "338": "Kefka's Tower: Minerva Room and Tack Star Room",
    "339": "Kefka's Tower",
    "340": "Thamasa: Exterior (WoB)",
    "341": "Thamasa: Exterior (Kefka Attack)",
    "342": "Thamasa: Exterior (Baram & Clyde)",
    "343": "Thamasa: Exterior (WoB, First Time)",
    "344": "Thamasa: Exterior (WoR)",
    "345": "Thamasa: Armory",
    "346": "Thamasa: Inn",
    "347": "Thamasa: Item Shop",
    "348": "Thamasa: Elder's House",
    "349": "Thamasa: Strago & Relm's House",
    "350": "Thamasa: Relic Shop",
    "351": "Thamasa: Burning Building",
    "352": "Kefka's Tower: Tube Room",
    "353": "Cave in the Veldt",
    "354": "Kefka's Tower: Goddess/Skull Dragon Rooms",
    "355": "Kefka's Tower: Doom/Upper Switch Rooms",
    "356": "Kefka's Tower: Top",
    "357": "Kefka's Tower: Top",
    "358": "Floating Island: Save Point",
    "359": "Fanatics' Tower: 2nd Level",
    "360": "Fanatics' Tower: 3rd Level",
    "361": "Fanatics' Tower: 4th Level",
    "362": "Fanatics' Tower: Bottom",
    "363": "Fanatics' Tower: 1st Level",
    "364": "Fanatics' Tower: Top",
    "365": "Fanatics' Tower: 1st Treasure Room",
    "366": "Fanatics' Tower: Top Treasure Room",
    "367": "Fanatics' Tower: 2nd Treasure Room",
    "368": "Fanatics' Tower: 3rd Treasure Room",
    "369": "Fanatics' Tower: 4th Treasure Room",
    "370": "Fanatics' Tower: Secret Treasure Room",
    "371": "Esper Mountain: Statue Cave",
    "372": "Esper Mountain: Exterior A",
    "373": "Esper Mountain: Exterior B",
    "374": "Esper Mountain: Exterior C",
    "375": "Esper Mountain: Caves",
    "376": "Floating Island: Exterior (Start of Collapse)",
    "377": "Imperial Base: Exterior",
    "378": "Imperial Base: Interior",
    "379": "Imperial Base: Unused",
    "380": "Floating Island: Parallax Only",
    "382": "Cave to the Sealed Gate: 1st Cave",
    "383": "Cave to the Sealed Gate: 2nd Cave",
    "384": "Cave to the Sealed Gate: Other Caves",
    "385": "Cave to the Sealed Gate: Lava Puzzle",
    "386": "Cave to the Sealed Gate: Save Point",
    "387": "Cave to the Sealed Gate (Unused)",
    "388": "Cave to the Sealed Gate (Unused)",
    "391": "Cave to the Sealed Gate: Gate",
    "392": "Jidoor: Exterior (Floating Island Shadow)",
    "393": "Floating Island: Exterior (Collapsing)",
    "394": "Floating Island: Exterior",
    "396": "Solitary Island: House Exterior",
    "397": "Solitary Island: House Interior",
    "398": "Solitary Island: Beach (Fish)",
    "399": "Solitary Island: Cliff",
    "400": "Solitary Island: Beach (Raft)",
    "401": "Ancient Castle: Cave",
    "402": "Ancient Castle: Save Point Cave",
    "403": "Solitary Island: Beach",
    "404": "Ebot's Rock: Teleport Caves",
    "405": "Ebot's Rock: Other Caves",
    "406": "Ancient Castle: Interior",
    "407": "Ancient Castle: Exterior",
    "408": "Ancient Castle: Library/Basement",
    "409": "Kefka's Tower: Tube Room",
    "410": "Kefka's Tower: Inferno's Room",
    "411": "Kefka's Tower: Final Switch Room",
    "412": "Kefka's Tower: Behind Poltergeist",
    "413": "Colosseum",
    "510": "Previous Map",
    "511": "Parent Map"
  }
};

// Reader opcodes and operands are grouped by active table. Long code ranges use digests.
const LAYOUT_CHECKS = [
  {
    "name": "Monster stats",
    "operands": {
      "bf0000f8": [
        142629
      ],
      "bf0100f8": [
        142581
      ],
      "bf0200f8": [
        142615
      ],
      "bf0300f8": [
        142595
      ],
      "bf0400f8": [
        142605
      ],
      "bf0500f8": [
        142499
      ],
      "bf0700f8": [
        142636
      ],
      "bf0800f8": [
        142535
      ],
      "bf0a00f8": [
        142525
      ],
      "bf0c00f8": [
        142506
      ],
      "bf0e00f8": [
        142513
      ],
      "bf1000f8": [
        142622
      ],
      "bf1100f8": [
        142897
      ],
      "bf1300f8": [
        142658
      ],
      "bf1400f8": [
        142874
      ],
      "bf1600f8": [
        142803
      ],
      "bf1700f8": [
        142887
      ],
      "bf1900f8": [
        142793
      ],
      "bf1a00f8": [
        132645,
        142588
      ],
      "bf1b00f8": [
        142825
      ],
      "bf1c00f8": [
        142864
      ],
      "bf1d00f8": [
        142832
      ],
      "bf1e00f8": [
        142646
      ],
      "bf1f00f8": [
        142786
      ]
    }
  },
  {
    "name": "Monster loot",
    "operands": {
      "bfdc44f8": [
        142401
      ],
      "bfde44f8": [
        155438
      ]
    }
  },
  {
    "name": "Monster names",
    "operands": {
      "bfec4bf8": [
        91712,
        92486,
        142422
      ],
      "dfec4bf8": [
        142456
      ]
    }
  },
  {
    "name": "Formation roster",
    "operands": {
      "bfc822f0": [
        69281,
        69300,
        143701
      ],
      "bfc922f0": [
        69311
      ],
      "bfd022f0": [
        69329,
        69343
      ],
      "bfd622f0": [
        69273
      ]
    }
  },
  {
    "name": "Item properties",
    "operands": {
      "bf6902f6": [
        135219,
        142066,
        152835,
        230668,
        230678,
        231268,
        235541,
        235607,
        236260,
        236292,
        236311,
        236336,
        236355,
        236545,
        236609,
        236669,
        237820,
        244628,
        244747
      ],
      "bf6a02f6": [
        152876,
        230785,
        235553,
        235619,
        236561,
        236621,
        236681,
        237832
      ],
      "bf6b02f6": [
        135197
      ],
      "bf6c02f6": [
        231468
      ],
      "bf6d02f6": [
        231476
      ],
      "bf6e02f6": [
        135075
      ],
      "bf6f02f6": [
        135084
      ],
      "bf7102f6": [
        135091
      ],
      "bf7302f6": [
        135098
      ],
      "bf7502f6": [
        135105
      ],
      "bf7702f6": [
        141091,
        152828
      ],
      "bf7802f6": [
        135235,
        135386,
        141933,
        231682
      ],
      "bf7902f6": [
        135112,
        231186
      ],
      "bf7a02f6": [
        231233
      ],
      "bf7b02f6": [
        135412,
        141109
      ],
      "bf7c02f6": [
        135419,
        141977,
        231358,
        231375,
        231394,
        235755,
        236083,
        236113,
        236187,
        236210
      ],
      "bf7d02f6": [
        135192,
        141926,
        231278,
        231441,
        238086,
        244647,
        244681
      ],
      "bf7e02f6": [
        135272,
        135405,
        141097,
        141961,
        142082,
        231294
      ],
      "bf7f02f6": [
        135249,
        135379,
        231867
      ],
      "bf8002f6": [
        141968,
        231881
      ],
      "bf8102f6": [
        135240,
        231895
      ],
      "bf8202f6": [
        135228
      ],
      "bf8302f6": [
        135148,
        231512
      ],
      "bf8402f6": [
        135303,
        141947
      ]
    }
  },
  {
    "name": "Added item names",
    "operands": {
      "bf8000f6": [
        92887,
        259907
      ],
      "bf8100f6": [
        4172386
      ]
    }
  },
  {
    "name": "Original item names",
    "operands": {
      "bf00b3d2": [
        91437,
        91509,
        92629,
        92703,
        206624,
        229694,
        233593,
        237008,
        246049
      ],
      "bf01b3d2": [
        33071,
        33774,
        4172391
      ]
    }
  },
  {
    "name": "Esper learning",
    "operands": {
      "bf006ed8": [
        155709,
        219733,
        219740,
        219786,
        220123,
        220137
      ],
      "bf016ed8": [
        155699
      ],
      "bf0a6ed8": [
        155882
      ]
    }
  },
  {
    "name": "Retail attack properties",
    "operands": {
      "bfc06ac4": [
        145265,
        153393,
        207580
      ],
      "bfc36ac4": [
        217530
      ],
      "bfc56ac4": [
        145260,
        151374,
        153388,
        217447
      ]
    }
  },
  {
    "name": "Map directory",
    "operands": {
      "bf9629f2": [
        7359
      ]
    }
  },
  {
    "name": "Player spell names",
    "operands": {
      "bfbd59f0": [
        91632,
        92843
      ],
      "bfbe59f0": [
        33834,
        90158
      ]
    }
  },
  {
    "name": "Esper names",
    "operands": {
      "bf105cf0": [
        90116,
        91608,
        91797,
        210168,
        219683
      ]
    }
  },
  {
    "name": "Expanded battle dispatch entry",
    "at": 141670,
    "size": 3,
    "sha": "46d56102a5317899d5fdcc986b7f70cf1faa9a38c28316c3783511d18395eed7"
  },
  {
    "name": "Player spell and summon dispatch",
    "at": 158142,
    "size": 235,
    "sha": "d706eacfef783eec0a6947601ed2ca400796ad9079647a953130859fdd436e8f"
  },
  {
    "name": "Map directory indexing",
    "at": 7341,
    "size": 33,
    "sha": "d42fa0d03eac3781d68dca0bde9c4001b00588aa999647c9c1803a3c0bb53f9e"
  },
  {
    "name": "Esper count and ownership scan",
    "at": 218393,
    "size": 18,
    "sha": "8cc035f46d358b149682e2406bcdff05865b494930169437178009a77ae1d431"
  },
  {
    "name": "Esper learning record stride",
    "at": 156308,
    "size": 18,
    "sha": "a69afdf505359e6b452582de66df0b41781533a0ef38781347c319b6c55e67cf"
  },
  {
    "name": "Expanded Esper reward dispatch",
    "at": 160221,
    "size": 110,
    "sha": "08ab10052d8fdd7ba6b371899e64b7ac038552d254acf01f287b66739836e371"
  },
  {
    "name": "Valor reward",
    "at": 160506,
    "size": 98,
    "sha": "bd94f08a7b609e2b0461484acabc622a53f351fa223e7af196664db586c12ac3"
  },
  {
    "name": "Gravija reward",
    "at": 160844,
    "size": 51,
    "sha": "a355e5f6aed247284b7d8b9395896d53f4da508a176b6760457f4a0ae5413c5b"
  },
  {
    "name": "Formation preview graphics records",
    "operands": {
      "bf3c6ff8": [
        73856,
        75019
      ],
      "bf3d6ff8": [
        73869,
        75032
      ],
      "bf3e6ff8": [
        73826,
        73878,
        75004,
        75041
      ],
      "bf406ff8": [
        73899,
        75062
      ]
    }
  },
  {
    "name": "Formation preview palette",
    "operands": {
      "bf987bf8": [
        74557,
        120359
      ]
    }
  },
  {
    "name": "Formation preview masks",
    "operands": {
      "6f20a8d2": [
        74094
      ],
      "6f22a8d2": [
        74132
      ]
    }
  },
  {
    "name": "Formation preview slot directory",
    "operands": {
      "bf3bd0c2": [
        73925,
        75079
      ]
    }
  },
  {
    "name": "Formation preview graphics routing",
    "operands": {
      "226817f0": [
        73983
      ]
    }
  }
];
// Additional Regular record editors. Derived from upstream ff3u-sfc.json.
Object.assign(PROFILE.tables,{
  "characters": {
    "name": "Character starting stats",
    "start": 2981024,
    "width": 22,
    "count": 64,
    "fields": {
      "hp": {
        "name": "Base HP",
        "begin": 0,
        "type": "property"
      },
      "mp": {
        "name": "Base MP",
        "begin": 1,
        "type": "property"
      },
      "command1": {
        "name": "Command 1",
        "begin": 2,
        "type": "property",
        "domain": "commands"
      },
      "command2": {
        "name": "Command 2",
        "begin": 3,
        "type": "property",
        "domain": "commands"
      },
      "command3": {
        "name": "Command 3",
        "begin": 4,
        "type": "property",
        "domain": "commands"
      },
      "command4": {
        "name": "Command 4",
        "begin": 5,
        "type": "property",
        "domain": "commands"
      },
      "vigor": {
        "name": "Vigor",
        "begin": 6,
        "type": "property"
      },
      "speed": {
        "name": "Speed",
        "begin": 7,
        "type": "property"
      },
      "stamina": {
        "name": "Stamina",
        "begin": 8,
        "type": "property"
      },
      "magicPower": {
        "name": "Magic Power",
        "begin": 9,
        "type": "property"
      },
      "battlePower": {
        "name": "Battle Power",
        "begin": 10,
        "type": "property"
      },
      "defense": {
        "name": "Defense",
        "begin": 11,
        "type": "property"
      },
      "magicDefense": {
        "name": "Magic Defense",
        "begin": 12,
        "type": "property"
      },
      "evade": {
        "name": "Evade",
        "begin": 13,
        "type": "property"
      },
      "magicBlock": {
        "name": "Magic Block",
        "begin": 14,
        "type": "property"
      },
      "weapon": {
        "name": "Weapon",
        "begin": 15,
        "type": "property",
        "domain": "loot"
      },
      "shield": {
        "name": "Shield",
        "begin": 16,
        "type": "property",
        "domain": "loot"
      },
      "helmet": {
        "name": "Helmet",
        "begin": 17,
        "type": "property",
        "domain": "loot"
      },
      "armor": {
        "name": "Armor",
        "begin": 18,
        "type": "property",
        "domain": "loot"
      },
      "relic1": {
        "name": "Relic 1",
        "begin": 19,
        "type": "property",
        "domain": "loot"
      },
      "relic2": {
        "name": "Relic 2",
        "begin": 20,
        "type": "property",
        "domain": "loot"
      },
      "fixedEquipment": {
        "name": "Fixed Equipment",
        "bool": true,
        "mask": "0x10",
        "begin": 21,
        "type": "property"
      }
    }
  },
  "shops": {
    "name": "Shops",
    "start": 293568,
    "width": 9,
    "count": 128,
    "fields": {
      "shopType": {
        "name": "Type",
        "mask": "0x07",
        "begin": 0,
        "type": "property",
        "domain": "shopType"
      },
      "priceAdjust": {
        "name": "Price Modifier",
        "mask": "0x38",
        "begin": 0,
        "type": "property",
        "domain": "priceAdjust"
      },
      "item1": {
        "name": "Item 1",
        "begin": 1,
        "type": "property",
        "domain": "loot"
      },
      "item2": {
        "name": "Item 2",
        "begin": 2,
        "type": "property",
        "domain": "loot"
      },
      "item3": {
        "name": "Item 3",
        "begin": 3,
        "type": "property",
        "domain": "loot"
      },
      "item4": {
        "name": "Item 4",
        "begin": 4,
        "type": "property",
        "domain": "loot"
      },
      "item5": {
        "name": "Item 5",
        "begin": 5,
        "type": "property",
        "domain": "loot"
      },
      "item6": {
        "name": "Item 6",
        "begin": 6,
        "type": "property",
        "domain": "loot"
      },
      "item7": {
        "name": "Item 7",
        "begin": 7,
        "type": "property",
        "domain": "loot"
      },
      "item8": {
        "name": "Item 8",
        "begin": 8,
        "type": "property",
        "domain": "loot"
      }
    }
  },
  "rageMoves": {
    "name": "Rage attacks",
    "start": 1000960,
    "width": 2,
    "count": 256,
    "fields": {
      "attack1": {
        "name": "Rage Attack 1",
        "begin": 0,
        "type": "property",
        "domain": "attacks"
      },
      "attack2": {
        "name": "Rage Attack 2",
        "begin": 1,
        "type": "property",
        "domain": "attacks"
      }
    }
  },
  "danceMoves": {
    "name": "Dance attacks",
    "start": 1048192,
    "width": 4,
    "count": 8,
    "fields": {
      "attack1": {
        "name": "Attack 1",
        "begin": 0,
        "type": "property",
        "domain": "attacks"
      },
      "attack2": {
        "name": "Attack 2",
        "begin": 1,
        "type": "property",
        "domain": "attacks"
      },
      "attack3": {
        "name": "Attack 3",
        "begin": 2,
        "type": "property",
        "domain": "attacks"
      },
      "attack4": {
        "name": "Attack 4",
        "begin": 3,
        "type": "property",
        "domain": "attacks"
      }
    }
  },
  "controlMoves": {
    "name": "Control attacks",
    "start": 3684932,
    "width": 4,
    "count": 452,
    "fields": {
      "attack1": {
        "name": "Control Attack 1",
        "begin": 0,
        "type": "property",
        "domain": "attacks"
      },
      "attack2": {
        "name": "Control Attack 2",
        "begin": 1,
        "type": "property",
        "domain": "attacks"
      },
      "attack3": {
        "name": "Control Attack 3",
        "begin": 2,
        "type": "property",
        "domain": "attacks"
      },
      "attack4": {
        "name": "Control Attack 4",
        "begin": 3,
        "type": "property",
        "domain": "attacks"
      }
    },
    "mirror": [
      998656,
      384
    ]
  },
  "sketchMoves": {
    "name": "Sketch attacks",
    "start": 3686740,
    "width": 2,
    "count": 452,
    "fields": {
      "attack1": {
        "name": "Sketch Attack 1",
        "begin": 0,
        "type": "property",
        "domain": "attacks"
      },
      "attack2": {
        "name": "Sketch Attack 2",
        "begin": 1,
        "type": "property",
        "domain": "attacks"
      }
    },
    "mirror": [
      1000192,
      384
    ]
  },
  "naturalMagic": {
    "name": "Natural magic",
    "start": 2941888,
    "width": 32,
    "count": 2,
    "fields": {
      "spell1": {
        "name": "Spell 1",
        "begin": 0,
        "type": "property",
        "domain": "stockSpells"
      },
      "level1": {
        "name": "Level 1",
        "max": 99,
        "begin": 1,
        "type": "property"
      },
      "spell2": {
        "name": "Spell 2",
        "begin": 2,
        "type": "property",
        "domain": "stockSpells"
      },
      "level2": {
        "name": "Level 2",
        "max": 99,
        "begin": 3,
        "type": "property"
      },
      "spell3": {
        "name": "Spell 3",
        "begin": 4,
        "type": "property",
        "domain": "stockSpells"
      },
      "level3": {
        "name": "Level 3",
        "max": 99,
        "begin": 5,
        "type": "property"
      },
      "spell4": {
        "name": "Spell 4",
        "begin": 6,
        "type": "property",
        "domain": "stockSpells"
      },
      "level4": {
        "name": "Level 4",
        "max": 99,
        "begin": 7,
        "type": "property"
      },
      "spell5": {
        "name": "Spell 5",
        "begin": 8,
        "type": "property",
        "domain": "stockSpells"
      },
      "level5": {
        "name": "Level 5",
        "max": 99,
        "begin": 9,
        "type": "property"
      },
      "spell6": {
        "name": "Spell 6",
        "begin": 10,
        "type": "property",
        "domain": "stockSpells"
      },
      "level6": {
        "name": "Level 6",
        "max": 99,
        "begin": 11,
        "type": "property"
      },
      "spell7": {
        "name": "Spell 7",
        "begin": 12,
        "type": "property",
        "domain": "stockSpells"
      },
      "level7": {
        "name": "Level 7",
        "max": 99,
        "begin": 13,
        "type": "property"
      },
      "spell8": {
        "name": "Spell 8",
        "begin": 14,
        "type": "property",
        "domain": "stockSpells"
      },
      "level8": {
        "name": "Level 8",
        "max": 99,
        "begin": 15,
        "type": "property"
      },
      "spell9": {
        "name": "Spell 9",
        "begin": 16,
        "type": "property",
        "domain": "stockSpells"
      },
      "level9": {
        "name": "Level 9",
        "max": 99,
        "begin": 17,
        "type": "property"
      },
      "spell10": {
        "name": "Spell 10",
        "begin": 18,
        "type": "property",
        "domain": "stockSpells"
      },
      "level10": {
        "name": "Level 10",
        "max": 99,
        "begin": 19,
        "type": "property"
      },
      "spell11": {
        "name": "Spell 11",
        "begin": 20,
        "type": "property",
        "domain": "stockSpells"
      },
      "level11": {
        "name": "Level 11",
        "max": 99,
        "begin": 21,
        "type": "property"
      },
      "spell12": {
        "name": "Spell 12",
        "begin": 22,
        "type": "property",
        "domain": "stockSpells"
      },
      "level12": {
        "name": "Level 12",
        "max": 99,
        "begin": 23,
        "type": "property"
      },
      "spell13": {
        "name": "Spell 13",
        "begin": 24,
        "type": "property",
        "domain": "stockSpells"
      },
      "level13": {
        "name": "Level 13",
        "max": 99,
        "begin": 25,
        "type": "property"
      },
      "spell14": {
        "name": "Spell 14",
        "begin": 26,
        "type": "property",
        "domain": "stockSpells"
      },
      "level14": {
        "name": "Level 14",
        "max": 99,
        "begin": 27,
        "type": "property"
      },
      "spell15": {
        "name": "Spell 15",
        "begin": 28,
        "type": "property",
        "domain": "stockSpells"
      },
      "level15": {
        "name": "Level 15",
        "max": 99,
        "begin": 29,
        "type": "property"
      },
      "spell16": {
        "name": "Spell 16",
        "begin": 30,
        "type": "property",
        "domain": "stockSpells"
      },
      "level16": {
        "name": "Level 16",
        "max": 99,
        "begin": 31,
        "type": "property"
      }
    }
  },
  "blitzLevels": {
    "name": "Blitz learning",
    "start": 2552984,
    "width": 1,
    "count": 8,
    "fields": {
      "level": {
        "name": "Learn at Level",
        "max": 99,
        "type": "property",
        "begin": 0
      }
    }
  },
  "swordLevels": {
    "name": "SwdTech learning",
    "start": 2552976,
    "width": 1,
    "count": 8,
    "fields": {
      "level": {
        "name": "Learn at Level",
        "max": 99,
        "type": "property",
        "begin": 0
      }
    }
  }
});
LAYOUT_CHECKS.push(...[
  {
    "name": "Character starting stats",
    "operands": {
      "bfa07ced": [
        41219,
        41632
      ]
    }
  },
  {
    "name": "Shops",
    "operands": {
      "bfc07ac4": [
        244293,
        244424,
        245897
      ]
    }
  },
  {
    "name": "Rage attacks",
    "operands": {
      "bf0046cf": [
        132617
      ]
    }
  },
  {
    "name": "Dance attacks",
    "operands": {
      "bf80fecf": [
        132552
      ]
    }
  },
  {
    "name": "Control attacks",
    "operands": {
      "bf443af8": [
        132669,
        145240
      ]
    }
  },
  {
    "name": "Sketch attacks",
    "operands": {
      "bf5441f8": [
        146266
      ]
    }
  },
  {
    "name": "Natural magic",
    "operands": {
      "bfc0e3ec": [
        41393,
        156171
      ]
    }
  },
  {
    "name": "Blitz learning",
    "operands": {
      "bf98f4e6": [
        41490
      ]
    }
  },
  {
    "name": "SwdTech learning",
    "operands": {
      "bf90f4e6": [
        41451
      ],
      "df90f4e6": [
        156200
      ]
    }
  }
]);
// Fixed map-object arrays in Regular and the pointer tables that group them by map.
const MAP_OBJECT_INDEX={
  "mapNPCs": {
    "pointer": 3801088,
    "base": 3801088,
    "first": 864,
    "last": 21447
  },
  "mapTreasure": {
    "pointer": 3301669,
    "base": 3302533,
    "first": 0,
    "last": 1560
  },
  "mapEvents": {
    "pointer": 3276800,
    "base": 3276800,
    "first": 864,
    "last": 7699
  },
  "shortExits": {
    "pointer": 2079488,
    "base": 2079488,
    "first": 1026,
    "last": 7800
  },
  "longExits": {
    "pointer": 3284992,
    "base": 3284992,
    "first": 1026,
    "last": 2454
  }
};
Object.assign(PROFILE.tables,{
  "mapNPCs": {
    "name": "Map NPCs",
    "start": 3801952,
    "width": 9,
    "count": 2287,
    "fields": {
      "x": {
        "type": "property",
        "name": "Map X",
        "begin": 4,
        "mask": 127
      },
      "y": {
        "type": "property",
        "name": "Map Y",
        "begin": 5,
        "mask": 63
      },
      "palette": {
        "type": "property",
        "name": "Sprite palette",
        "begin": 2,
        "mask": 28
      },
      "speed": {
        "type": "property",
        "name": "Movement speed",
        "begin": 5,
        "mask": 192,
        "domain": "npcSpeed"
      },
      "graphics": {
        "type": "property",
        "name": "Sprite graphics",
        "begin": 6,
        "mask": 255
      },
      "switchId": {
        "type": "property",
        "name": "Visibility switch",
        "begin": 2,
        "mask": 65472
      }
    }
  },
  "mapTreasure": {
    "name": "Treasure chests",
    "start": 3302533,
    "width": 5,
    "count": 312,
    "fields": {
      "x": {
        "type": "property",
        "name": "Map X",
        "begin": 0,
        "mask": 255
      },
      "y": {
        "type": "property",
        "name": "Map Y",
        "begin": 1,
        "mask": 255
      },
      "switchId": {
        "type": "property",
        "name": "Opened-chest flag",
        "begin": 2,
        "mask": 511
      },
      "reward": {
        "type": "property",
        "name": "Reward type",
        "begin": 3,
        "mask": 240,
        "domain": "chestType"
      },
      "value": {
        "type": "property",
        "name": "Reward byte",
        "begin": 4,
        "mask": 255
      }
    }
  },
  "mapEvents": {
    "name": "Map event triggers",
    "start": 3277664,
    "width": 5,
    "count": 1367,
    "fields": {
      "x": {
        "type": "property",
        "name": "Map X",
        "begin": 0,
        "mask": 255
      },
      "y": {
        "type": "property",
        "name": "Map Y",
        "begin": 1,
        "mask": 255
      },
      "event": {
        "type": "property",
        "name": "Field event offset",
        "begin": 2,
        "mask": 16777215,
        "readOnly": true
      }
    }
  },
  "shortExits": {
    "name": "Single-tile exits",
    "start": 2080514,
    "width": 6,
    "count": 1129,
    "fields": {
      "x": {
        "type": "property",
        "name": "Map X",
        "begin": 0,
        "mask": 255
      },
      "y": {
        "type": "property",
        "name": "Map Y",
        "begin": 1,
        "mask": 255
      },
      "dest": {
        "type": "property",
        "name": "Destination map",
        "begin": 2,
        "mask": 511,
        "domain": "destMaps"
      },
      "setParentMap": {
        "type": "property",
        "name": "Set parent map",
        "begin": 3,
        "mask": 2,
        "bool": true
      },
      "elevation": {
        "type": "property",
        "name": "Upper level",
        "begin": 3,
        "mask": 4,
        "bool": true
      },
      "title": {
        "type": "property",
        "name": "Show map title",
        "begin": 3,
        "mask": 8,
        "bool": true
      },
      "facing": {
        "type": "property",
        "name": "Facing",
        "begin": 3,
        "mask": 48,
        "domain": "directions"
      },
      "destX": {
        "type": "property",
        "name": "Destination X",
        "begin": 4,
        "mask": 255
      },
      "destY": {
        "type": "property",
        "name": "Destination Y",
        "begin": 5,
        "mask": 255
      }
    }
  },
  "longExits": {
    "name": "Multi-tile exits",
    "start": 3286018,
    "width": 7,
    "count": 204,
    "fields": {
      "x": {
        "type": "property",
        "name": "Map X",
        "begin": 0,
        "mask": 255
      },
      "y": {
        "type": "property",
        "name": "Map Y",
        "begin": 1,
        "mask": 255
      },
      "span": {
        "type": "property",
        "name": "Length minus one",
        "begin": 2,
        "mask": 127
      },
      "vertical": {
        "type": "property",
        "name": "Vertical",
        "begin": 2,
        "mask": 128,
        "bool": true
      },
      "dest": {
        "type": "property",
        "name": "Destination map",
        "begin": 3,
        "mask": 511,
        "domain": "destMaps"
      },
      "setParentMap": {
        "type": "property",
        "name": "Set parent map",
        "begin": 4,
        "mask": 2,
        "bool": true
      },
      "elevation": {
        "type": "property",
        "name": "Upper level",
        "begin": 4,
        "mask": 4,
        "bool": true
      },
      "title": {
        "type": "property",
        "name": "Show map title",
        "begin": 4,
        "mask": 8,
        "bool": true
      },
      "facing": {
        "type": "property",
        "name": "Facing",
        "begin": 4,
        "mask": 48,
        "domain": "directions"
      },
      "destX": {
        "type": "property",
        "name": "Destination X",
        "begin": 5,
        "mask": 255
      },
      "destY": {
        "type": "property",
        "name": "Destination Y",
        "begin": 6,
        "mask": 255
      }
    }
  },
  "fieldPalettes": {
    "name": "Field palettes",
    "start": 3327104,
    "width": 256,
    "count": 49,
    "fields": {
      "c0": {
        "type": "property",
        "name": "Color 0",
        "begin": 0,
        "mask": 32767
      },
      "c1": {
        "type": "property",
        "name": "Color 1",
        "begin": 2,
        "mask": 32767
      },
      "c2": {
        "type": "property",
        "name": "Color 2",
        "begin": 4,
        "mask": 32767
      },
      "c3": {
        "type": "property",
        "name": "Color 3",
        "begin": 6,
        "mask": 32767
      },
      "c4": {
        "type": "property",
        "name": "Color 4",
        "begin": 8,
        "mask": 32767
      },
      "c5": {
        "type": "property",
        "name": "Color 5",
        "begin": 10,
        "mask": 32767
      },
      "c6": {
        "type": "property",
        "name": "Color 6",
        "begin": 12,
        "mask": 32767
      },
      "c7": {
        "type": "property",
        "name": "Color 7",
        "begin": 14,
        "mask": 32767
      },
      "c8": {
        "type": "property",
        "name": "Color 8",
        "begin": 16,
        "mask": 32767
      },
      "c9": {
        "type": "property",
        "name": "Color 9",
        "begin": 18,
        "mask": 32767
      },
      "c10": {
        "type": "property",
        "name": "Color 10",
        "begin": 20,
        "mask": 32767
      },
      "c11": {
        "type": "property",
        "name": "Color 11",
        "begin": 22,
        "mask": 32767
      },
      "c12": {
        "type": "property",
        "name": "Color 12",
        "begin": 24,
        "mask": 32767
      },
      "c13": {
        "type": "property",
        "name": "Color 13",
        "begin": 26,
        "mask": 32767
      },
      "c14": {
        "type": "property",
        "name": "Color 14",
        "begin": 28,
        "mask": 32767
      },
      "c15": {
        "type": "property",
        "name": "Color 15",
        "begin": 30,
        "mask": 32767
      },
      "c16": {
        "type": "property",
        "name": "Color 16",
        "begin": 32,
        "mask": 32767
      },
      "c17": {
        "type": "property",
        "name": "Color 17",
        "begin": 34,
        "mask": 32767
      },
      "c18": {
        "type": "property",
        "name": "Color 18",
        "begin": 36,
        "mask": 32767
      },
      "c19": {
        "type": "property",
        "name": "Color 19",
        "begin": 38,
        "mask": 32767
      },
      "c20": {
        "type": "property",
        "name": "Color 20",
        "begin": 40,
        "mask": 32767
      },
      "c21": {
        "type": "property",
        "name": "Color 21",
        "begin": 42,
        "mask": 32767
      },
      "c22": {
        "type": "property",
        "name": "Color 22",
        "begin": 44,
        "mask": 32767
      },
      "c23": {
        "type": "property",
        "name": "Color 23",
        "begin": 46,
        "mask": 32767
      },
      "c24": {
        "type": "property",
        "name": "Color 24",
        "begin": 48,
        "mask": 32767
      },
      "c25": {
        "type": "property",
        "name": "Color 25",
        "begin": 50,
        "mask": 32767
      },
      "c26": {
        "type": "property",
        "name": "Color 26",
        "begin": 52,
        "mask": 32767
      },
      "c27": {
        "type": "property",
        "name": "Color 27",
        "begin": 54,
        "mask": 32767
      },
      "c28": {
        "type": "property",
        "name": "Color 28",
        "begin": 56,
        "mask": 32767
      },
      "c29": {
        "type": "property",
        "name": "Color 29",
        "begin": 58,
        "mask": 32767
      },
      "c30": {
        "type": "property",
        "name": "Color 30",
        "begin": 60,
        "mask": 32767
      },
      "c31": {
        "type": "property",
        "name": "Color 31",
        "begin": 62,
        "mask": 32767
      },
      "c32": {
        "type": "property",
        "name": "Color 32",
        "begin": 64,
        "mask": 32767
      },
      "c33": {
        "type": "property",
        "name": "Color 33",
        "begin": 66,
        "mask": 32767
      },
      "c34": {
        "type": "property",
        "name": "Color 34",
        "begin": 68,
        "mask": 32767
      },
      "c35": {
        "type": "property",
        "name": "Color 35",
        "begin": 70,
        "mask": 32767
      },
      "c36": {
        "type": "property",
        "name": "Color 36",
        "begin": 72,
        "mask": 32767
      },
      "c37": {
        "type": "property",
        "name": "Color 37",
        "begin": 74,
        "mask": 32767
      },
      "c38": {
        "type": "property",
        "name": "Color 38",
        "begin": 76,
        "mask": 32767
      },
      "c39": {
        "type": "property",
        "name": "Color 39",
        "begin": 78,
        "mask": 32767
      },
      "c40": {
        "type": "property",
        "name": "Color 40",
        "begin": 80,
        "mask": 32767
      },
      "c41": {
        "type": "property",
        "name": "Color 41",
        "begin": 82,
        "mask": 32767
      },
      "c42": {
        "type": "property",
        "name": "Color 42",
        "begin": 84,
        "mask": 32767
      },
      "c43": {
        "type": "property",
        "name": "Color 43",
        "begin": 86,
        "mask": 32767
      },
      "c44": {
        "type": "property",
        "name": "Color 44",
        "begin": 88,
        "mask": 32767
      },
      "c45": {
        "type": "property",
        "name": "Color 45",
        "begin": 90,
        "mask": 32767
      },
      "c46": {
        "type": "property",
        "name": "Color 46",
        "begin": 92,
        "mask": 32767
      },
      "c47": {
        "type": "property",
        "name": "Color 47",
        "begin": 94,
        "mask": 32767
      },
      "c48": {
        "type": "property",
        "name": "Color 48",
        "begin": 96,
        "mask": 32767
      },
      "c49": {
        "type": "property",
        "name": "Color 49",
        "begin": 98,
        "mask": 32767
      },
      "c50": {
        "type": "property",
        "name": "Color 50",
        "begin": 100,
        "mask": 32767
      },
      "c51": {
        "type": "property",
        "name": "Color 51",
        "begin": 102,
        "mask": 32767
      },
      "c52": {
        "type": "property",
        "name": "Color 52",
        "begin": 104,
        "mask": 32767
      },
      "c53": {
        "type": "property",
        "name": "Color 53",
        "begin": 106,
        "mask": 32767
      },
      "c54": {
        "type": "property",
        "name": "Color 54",
        "begin": 108,
        "mask": 32767
      },
      "c55": {
        "type": "property",
        "name": "Color 55",
        "begin": 110,
        "mask": 32767
      },
      "c56": {
        "type": "property",
        "name": "Color 56",
        "begin": 112,
        "mask": 32767
      },
      "c57": {
        "type": "property",
        "name": "Color 57",
        "begin": 114,
        "mask": 32767
      },
      "c58": {
        "type": "property",
        "name": "Color 58",
        "begin": 116,
        "mask": 32767
      },
      "c59": {
        "type": "property",
        "name": "Color 59",
        "begin": 118,
        "mask": 32767
      },
      "c60": {
        "type": "property",
        "name": "Color 60",
        "begin": 120,
        "mask": 32767
      },
      "c61": {
        "type": "property",
        "name": "Color 61",
        "begin": 122,
        "mask": 32767
      },
      "c62": {
        "type": "property",
        "name": "Color 62",
        "begin": 124,
        "mask": 32767
      },
      "c63": {
        "type": "property",
        "name": "Color 63",
        "begin": 126,
        "mask": 32767
      },
      "c64": {
        "type": "property",
        "name": "Color 64",
        "begin": 128,
        "mask": 32767
      },
      "c65": {
        "type": "property",
        "name": "Color 65",
        "begin": 130,
        "mask": 32767
      },
      "c66": {
        "type": "property",
        "name": "Color 66",
        "begin": 132,
        "mask": 32767
      },
      "c67": {
        "type": "property",
        "name": "Color 67",
        "begin": 134,
        "mask": 32767
      },
      "c68": {
        "type": "property",
        "name": "Color 68",
        "begin": 136,
        "mask": 32767
      },
      "c69": {
        "type": "property",
        "name": "Color 69",
        "begin": 138,
        "mask": 32767
      },
      "c70": {
        "type": "property",
        "name": "Color 70",
        "begin": 140,
        "mask": 32767
      },
      "c71": {
        "type": "property",
        "name": "Color 71",
        "begin": 142,
        "mask": 32767
      },
      "c72": {
        "type": "property",
        "name": "Color 72",
        "begin": 144,
        "mask": 32767
      },
      "c73": {
        "type": "property",
        "name": "Color 73",
        "begin": 146,
        "mask": 32767
      },
      "c74": {
        "type": "property",
        "name": "Color 74",
        "begin": 148,
        "mask": 32767
      },
      "c75": {
        "type": "property",
        "name": "Color 75",
        "begin": 150,
        "mask": 32767
      },
      "c76": {
        "type": "property",
        "name": "Color 76",
        "begin": 152,
        "mask": 32767
      },
      "c77": {
        "type": "property",
        "name": "Color 77",
        "begin": 154,
        "mask": 32767
      },
      "c78": {
        "type": "property",
        "name": "Color 78",
        "begin": 156,
        "mask": 32767
      },
      "c79": {
        "type": "property",
        "name": "Color 79",
        "begin": 158,
        "mask": 32767
      },
      "c80": {
        "type": "property",
        "name": "Color 80",
        "begin": 160,
        "mask": 32767
      },
      "c81": {
        "type": "property",
        "name": "Color 81",
        "begin": 162,
        "mask": 32767
      },
      "c82": {
        "type": "property",
        "name": "Color 82",
        "begin": 164,
        "mask": 32767
      },
      "c83": {
        "type": "property",
        "name": "Color 83",
        "begin": 166,
        "mask": 32767
      },
      "c84": {
        "type": "property",
        "name": "Color 84",
        "begin": 168,
        "mask": 32767
      },
      "c85": {
        "type": "property",
        "name": "Color 85",
        "begin": 170,
        "mask": 32767
      },
      "c86": {
        "type": "property",
        "name": "Color 86",
        "begin": 172,
        "mask": 32767
      },
      "c87": {
        "type": "property",
        "name": "Color 87",
        "begin": 174,
        "mask": 32767
      },
      "c88": {
        "type": "property",
        "name": "Color 88",
        "begin": 176,
        "mask": 32767
      },
      "c89": {
        "type": "property",
        "name": "Color 89",
        "begin": 178,
        "mask": 32767
      },
      "c90": {
        "type": "property",
        "name": "Color 90",
        "begin": 180,
        "mask": 32767
      },
      "c91": {
        "type": "property",
        "name": "Color 91",
        "begin": 182,
        "mask": 32767
      },
      "c92": {
        "type": "property",
        "name": "Color 92",
        "begin": 184,
        "mask": 32767
      },
      "c93": {
        "type": "property",
        "name": "Color 93",
        "begin": 186,
        "mask": 32767
      },
      "c94": {
        "type": "property",
        "name": "Color 94",
        "begin": 188,
        "mask": 32767
      },
      "c95": {
        "type": "property",
        "name": "Color 95",
        "begin": 190,
        "mask": 32767
      },
      "c96": {
        "type": "property",
        "name": "Color 96",
        "begin": 192,
        "mask": 32767
      },
      "c97": {
        "type": "property",
        "name": "Color 97",
        "begin": 194,
        "mask": 32767
      },
      "c98": {
        "type": "property",
        "name": "Color 98",
        "begin": 196,
        "mask": 32767
      },
      "c99": {
        "type": "property",
        "name": "Color 99",
        "begin": 198,
        "mask": 32767
      },
      "c100": {
        "type": "property",
        "name": "Color 100",
        "begin": 200,
        "mask": 32767
      },
      "c101": {
        "type": "property",
        "name": "Color 101",
        "begin": 202,
        "mask": 32767
      },
      "c102": {
        "type": "property",
        "name": "Color 102",
        "begin": 204,
        "mask": 32767
      },
      "c103": {
        "type": "property",
        "name": "Color 103",
        "begin": 206,
        "mask": 32767
      },
      "c104": {
        "type": "property",
        "name": "Color 104",
        "begin": 208,
        "mask": 32767
      },
      "c105": {
        "type": "property",
        "name": "Color 105",
        "begin": 210,
        "mask": 32767
      },
      "c106": {
        "type": "property",
        "name": "Color 106",
        "begin": 212,
        "mask": 32767
      },
      "c107": {
        "type": "property",
        "name": "Color 107",
        "begin": 214,
        "mask": 32767
      },
      "c108": {
        "type": "property",
        "name": "Color 108",
        "begin": 216,
        "mask": 32767
      },
      "c109": {
        "type": "property",
        "name": "Color 109",
        "begin": 218,
        "mask": 32767
      },
      "c110": {
        "type": "property",
        "name": "Color 110",
        "begin": 220,
        "mask": 32767
      },
      "c111": {
        "type": "property",
        "name": "Color 111",
        "begin": 222,
        "mask": 32767
      },
      "c112": {
        "type": "property",
        "name": "Color 112",
        "begin": 224,
        "mask": 32767
      },
      "c113": {
        "type": "property",
        "name": "Color 113",
        "begin": 226,
        "mask": 32767
      },
      "c114": {
        "type": "property",
        "name": "Color 114",
        "begin": 228,
        "mask": 32767
      },
      "c115": {
        "type": "property",
        "name": "Color 115",
        "begin": 230,
        "mask": 32767
      },
      "c116": {
        "type": "property",
        "name": "Color 116",
        "begin": 232,
        "mask": 32767
      },
      "c117": {
        "type": "property",
        "name": "Color 117",
        "begin": 234,
        "mask": 32767
      },
      "c118": {
        "type": "property",
        "name": "Color 118",
        "begin": 236,
        "mask": 32767
      },
      "c119": {
        "type": "property",
        "name": "Color 119",
        "begin": 238,
        "mask": 32767
      },
      "c120": {
        "type": "property",
        "name": "Color 120",
        "begin": 240,
        "mask": 32767
      },
      "c121": {
        "type": "property",
        "name": "Color 121",
        "begin": 242,
        "mask": 32767
      },
      "c122": {
        "type": "property",
        "name": "Color 122",
        "begin": 244,
        "mask": 32767
      },
      "c123": {
        "type": "property",
        "name": "Color 123",
        "begin": 246,
        "mask": 32767
      },
      "c124": {
        "type": "property",
        "name": "Color 124",
        "begin": 248,
        "mask": 32767
      },
      "c125": {
        "type": "property",
        "name": "Color 125",
        "begin": 250,
        "mask": 32767
      },
      "c126": {
        "type": "property",
        "name": "Color 126",
        "begin": 252,
        "mask": 32767
      },
      "c127": {
        "type": "property",
        "name": "Color 127",
        "begin": 254,
        "mask": 32767
      }
    }
  }
});
LAYOUT_CHECKS.push(...[
  {
    "name": "Map NPCs",
    "operands": {
      "bf0200fa": [
        21180,
        21227
      ],
      "bf0000fa": [
        21186,
        21204
      ],
      "bf0400fa": [
        21281
      ],
      "bf0500fa": [
        21338
      ],
      "bf0800fa": [
        21399
      ]
    }
  },
  {
    "name": "Treasure chests",
    "operands": {
      "bf2761f2": [
        5597,
        19418
      ],
      "bf2561f2": [
        5603,
        19424
      ],
      "bf8564f2": [
        5617,
        19436
      ],
      "bf8764f2": [
        5630
      ],
      "bf8964f2": [
        19464
      ]
    }
  },
  {
    "name": "Map event triggers",
    "operands": {
      "bf0200f2": [
        48315,
        48352,
        3023230
      ],
      "bf0000f2": [
        48321,
        48330,
        3023224
      ],
      "bf0400f2": [
        48378
      ]
    }
  },
  {
    "name": "Single-tile exits",
    "operands": {
      "bf02bbdf": [
        6781,
        6838,
        3023089
      ],
      "bf00bbdf": [
        6787,
        6799,
        3023083
      ],
      "bf04bbdf": [
        6886
      ]
    }
  },
  {
    "name": "Multi-tile exits",
    "operands": {
      "bf0220f2": [
        6378,
        6403
      ],
      "bf0020f2": [
        6384
      ],
      "ff0020f2": [
        6422
      ],
      "bf0320f2": [
        6499,
        6523
      ]
    }
  },
  {
    "name": "Field palettes",
    "operands": {
      "bf80c4f2": [
        9836
      ]
    }
  }
]);
// Field dialogue banks.
Object.assign(PROFILE.tables,{
  "dialogue": {
    "name": "Field dialogue",
    "width": 2,
    "start": 845314,
    "count": 3084,
    "dialogue": true,
    "idBase": 0,
    "fields": {
      "pointer": {
        "name": "Bank offset",
        "type": "property",
        "begin": 0,
        "mask": 65535,
        "readOnly": true
      }
    }
  },
  "addedDialogue": {
    "name": "Added field dialogue I",
    "width": 2,
    "start": 3145728,
    "count": 44,
    "dialogue": true,
    "idBase": 3872,
    "fields": {
      "pointer": {
        "name": "Bank offset",
        "type": "property",
        "begin": 0,
        "mask": 65535,
        "readOnly": true
      }
    }
  },
  "denDialogue": {
    "name": "Added field dialogue II",
    "width": 2,
    "start": 3304093,
    "count": 132,
    "dialogue": true,
    "idBase": 3916,
    "fields": {
      "pointer": {
        "name": "Bank offset",
        "type": "property",
        "begin": 0,
        "mask": 65535,
        "readOnly": true
      }
    }
  }
});
