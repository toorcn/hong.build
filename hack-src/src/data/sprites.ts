/**
 * 16×16 pixel sprites for the field manual. Each sprite is one or more frames;
 * a sprite with two frames animates between them (see index.css, `.sprite`).
 *
 * Legend:  X accent · o bright · , accent-dim · - slate · . empty
 */

export const PALETTE: Record<string, string> = {
  X: 'var(--color-accent)',
  o: 'var(--color-type)',
  ',': 'var(--color-accent-dim)',
  '-': 'var(--color-type-faint)',
}

const flag = [
  '................',
  '..X.............',
  '..XXXXXX........',
  '..XXXXXXXX......',
  '..XXXXXXXXXX....',
  '..XXXXXXXXX.....',
  '..XXXXXXX.......',
  '..XXXX..........',
  '..X.............',
  '..X.............',
  '..X.............',
  '..X.............',
  '..X.............',
  '.XXX............',
  '................',
  '................',
]

const clipboard = [
  '................',
  '......XXXX......',
  '...XXXXXXXXXX...',
  '...X..XXXX..X...',
  '...X........X...',
  '...X.oooooo.X...',
  '...X........X...',
  '...X.oooooo.X...',
  '...X........X...',
  '...X.oooo...X...',
  '...X........X...',
  '...X.oooooo.X...',
  '...X........X...',
  '...XXXXXXXXXX...',
  '................',
  '................',
]

const play = [
  '................',
  '................',
  '.XXXXXXXXXXXXXX.',
  '.X............X.',
  '.X..oo........X.',
  '.X..oooo......X.',
  '.X..oooooo....X.',
  '.X..oooooooo..X.',
  '.X..oooooo....X.',
  '.X..oooo......X.',
  '.X..oo........X.',
  '.X............X.',
  '.XXXXXXXXXXXXXX.',
  '....XXXXXXXX....',
  '................',
  '................',
]

const question = [
  '................',
  '..XXXXXXXXXXXX..',
  '.X............X.',
  '.X....oooo....X.',
  '.X...oo..oo...X.',
  '.X........oo..X.',
  '.X.......oo...X.',
  '.X......oo....X.',
  '.X......oo....X.',
  '.X............X.',
  '.X......oo....X.',
  '..XXXXXXXXXXX...',
  '...XX...........',
  '..XX............',
  '................',
  '................',
]

const mic = [
  '................',
  '......XXXX......',
  '.....XXXXXX.....',
  '.....XXooXX.....',
  '.....XXXXXX.....',
  '.....XXooXX.....',
  '.....XXXXXX.....',
  '..X..XXooXX..X..',
  '..X...XXXX...X..',
  '..XX........XX..',
  '...XXXXXXXXXX...',
  '.......XX.......',
  '.......XX.......',
  '.....XXXXXX.....',
  '................',
  '................',
]

const chip = [
  '................',
  '...X.X.X.X.X....',
  '...X.X.X.X.X....',
  '..XXXXXXXXXXXX..',
  '.XXXXXXXXXXXXXX.',
  '-XXXX......XXXX-',
  '-XXXX.oooo.XXXX-',
  '-XXXX.oooo.XXXX-',
  '-XXXX......XXXX-',
  '.XXXXXXXXXXXXXX.',
  '..XXXXXXXXXXXX..',
  '...X.X.X.X.X....',
  '...X.X.X.X.X....',
  '................',
  '................',
  '................',
]

const link = [
  '................',
  '................',
  '..XXXXXXXX......',
  '..X......X......',
  '..X..XXXXXXXX...',
  '..X..X...X..X...',
  '..X..X...X..X...',
  '..XXXXXXXX..X...',
  '.....X......X...',
  '.....XXXXXXXX...',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
]

const seedling = [
  '................',
  '................',
  '..........XX....',
  '.....XX..XXXX...',
  '....XXXX.XXXX...',
  '....XXXXXXXX....',
  '.....XXXXX......',
  '.......X........',
  '.......X........',
  '.......X........',
  '.......X........',
  '....,,,,,,,.....',
  '...,,,,,,,,,,,..',
  '................',
  '................',
  '................',
]

const bulb = [
  '................',
  '.......XX.......',
  '....X..XX..X....',
  '.....X....X.....',
  '.......XX.......',
  '..X..XXXXXX..X..',
  '....XXooXXXX....',
  '....XXooXXXX....',
  '....XXXXXXXX....',
  '.....XXXXXX.....',
  '......XXXX......',
  '......-XX-......',
  '......-XX-......',
  '.......--.......',
  '................',
  '................',
]

const hammer = [
  '................',
  '................',
  '....XXXXXXXX....',
  '....XXXXXXXXX...',
  '....XXXXXXXXX...',
  '....XXXXXXXX....',
  '.......XX.......',
  '.......oo.......',
  '.......oo.......',
  '.......oo.......',
  '.......oo.......',
  '.......oo.......',
  '.......oo.......',
  '................',
  '................',
  '................',
]

const alarm = [
  '................',
  '...XX......XX...',
  '..XXXXXXXXXXXX..',
  '...XXXXXXXXXX...',
  '..XX........XX..',
  '.XX....oo....XX.',
  '.X.....oo.....X.',
  '.X.....ooooo..X.',
  '.X............X.',
  '.XX..........XX.',
  '..XX........XX..',
  '...XXXXXXXXXX...',
  '...X........X...',
  '..XX........XX..',
  '................',
  '................',
]

const trophy = [
  '................',
  '..XXXXXXXXXXXX..',
  '..XooooooooooX..',
  '.XXooooooooooXX.',
  '.X.XooooooooX.X.',
  '.X..XooooooX..X.',
  '.XX..XXXXXX..XX.',
  '..X...XXXX...X..',
  '......XXXX......',
  '.......XX.......',
  '.......XX.......',
  '......XXXX......',
  '.....XXXXXX.....',
  '.....XXXXXX.....',
  '................',
  '................',
]

/** The mascot: the same small figure the journey uses, waving. */
const figureDown = [
  '................',
  '................',
  '......XXXX......',
  '.....XXXXXX.....',
  '.....XoXXoX.....',
  '.....XXXXXX.....',
  '......XXXX......',
  '.....XXXXXX.....',
  '....XXXXXXXX....',
  '....XXXXXXXX....',
  '....X.XXXX.X....',
  '....X.XXXX.X....',
  '.....XX..XX.....',
  '.....XX..XX.....',
  '.....XX..XX.....',
  '....XXX..XXX....',
]

const figureWave = [
  '................',
  '................',
  '......XXXX......',
  '.....XXXXXX.....',
  '.....XoXXoX.....',
  '.....XXXXXX.....',
  '......XXXX......',
  '.....XXXXXX...X.',
  '....XXXXXXXX..X.',
  '....XXXXXXXX.X..',
  '....X.XXXX.XX...',
  '....X.XXXX......',
  '.....XX..XX.....',
  '.....XX..XX.....',
  '.....XX..XX.....',
  '....XXX..XXX....',
]

export const sprites = {
  flag: [flag],
  clipboard: [clipboard],
  play: [play],
  question: [question],
  mic: [mic],
  chip: [chip],
  link: [link],
  seedling: [seedling],
  bulb: [bulb],
  hammer: [hammer],
  alarm: [alarm],
  trophy: [trophy],
  figure: [figureDown, figureWave],
} as const

export type SpriteName = keyof typeof sprites

/** The sprite that heads each section of the guide. */
export const sectionSprites = {
  start: 'flag',
  rules: 'clipboard',
  workshop: 'play',
  questions: 'question',
  playbook: 'mic',
  stack: 'chip',
  links: 'link',
} as const satisfies Record<string, SpriteName>

/** The sprite for each "where are you right now?" row, by its title. */
export const situationSprites: Record<string, SpriteName> = {
  "I've never done one": 'seedling',
  'I need an idea': 'bulb',
  "I'm building": 'hammer',
  "I'm pitching tomorrow": 'alarm',
  'I want to win': 'trophy',
}
