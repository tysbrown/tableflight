/// <reference types="@emotion/react/types/css-prop" />

export type User = {
  id: number
  tokenVersion: number
  firstName: string
  lastName: string
  email: string
  password: string
  games?: Game[]
}

export type Game = {
  id: number
  name: string
  description: string
  image: string
  createdBy: User
  createdById: number
  Grid: GridType
}

export type Token = {
  id: string
  type: "player" | "enemy" | "npc" | "item"
}

export type GridType = (Token | null | undefined)[][]

export type CharacterSheet = {
  id: number
  name: string
  description: string
  createdBy: User
  createdById: number
  stats: {
    level: number
    class: string
    race: string
    alignment: string
    background: string
    experience: number
    inspiration: boolean
    proficiencyBonus: number
    armorClass: number
    initiative: number
    speed: number
    hitPoints: {
      current: number
      max: number
      temp: number
    }
    hitDice: {
      current: number
      max: number
    }
    deathSaves: {
      successes: number
      failures: number
    }
    attacks: {
      name: string
      bonus: number
      damage: string
    }[]
    equipment: {
      name: string
      quantity: number
    }[]
    features: {
      name: string
      description: string
    }[]
    proficiencies: {
      name: string
      description: string
    }[]
    languages: {
      name: string
      description: string
    }[]
    spells: Spell[]
    abilities: Abilities
    savingThrows: SavingThrows
    skills: Skills
  }
}

export type Abilities = {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export type SavingThrows = {
  strength: {
    proficient: boolean
    bonus: number
  }
  dexterity: {
    proficient: boolean
    bonus: number
  }
  constitution: {
    proficient: boolean
    bonus: number
  }
  intelligence: {
    proficient: boolean
    bonus: number
  }
  wisdom: {
    proficient: boolean
    bonus: number
  }
  charisma: {
    proficient: boolean
    bonus: number
  }
}

export type Skills = {
  acrobatics: {
    proficient: boolean
    bonus: number
    ability: "dexterity"
  }
  animalHandling: {
    proficient: boolean
    bonus: number
    ability: "wisdom"
  }
  arcana: {
    proficient: boolean
    bonus: number
    ability: "intelligence"
  }
  athletics: {
    proficient: boolean
    bonus: number
    ability: "strength"
  }
  deception: {
    proficient: boolean
    bonus: number
    ability: "charisma"
  }
  history: {
    proficient: boolean
    bonus: number
    ability: "intelligence"
  }
  insight: {
    proficient: boolean
    bonus: number
    ability: "wisdom"
  }
  intimidation: {
    proficient: boolean
    bonus: number
    ability: "charisma"
  }
  investigation: {
    proficient: boolean
    bonus: number
    ability: "intelligence"
  }
  medicine: {
    proficient: boolean
    bonus: number
    ability: "wisdom"
  }
  nature: {
    proficient: boolean
    bonus: number
    ability: "intelligence"
  }
  perception: {
    proficient: boolean
    bonus: number
    ability: "wisdom"
  }
  performance: {
    proficient: boolean
    bonus: number
    ability: "charisma"
  }
  persuasion: {
    proficient: boolean
    bonus: number
    ability: "charisma"
  }
  religion: {
    proficient: boolean
    bonus: number
    ability: "intelligence"
  }
  sleightOfHand: {
    proficient: boolean
    bonus: number
    ability: "dexterity"
  }
  stealth: {
    proficient: boolean
    bonus: number
    ability: "dexterity"
  }
  survival: {
    proficient: boolean
    bonus: number
    ability: "wisdom"
  }
}

export type Spell = {
  id: number
  name: string
  level: number
  school: string
  description: string
  atHigherLevels: string
  castingTime: string
  range: string
  components: string
  duration: string
  concentration: boolean
  ritual: boolean
  classes: string[]
}
