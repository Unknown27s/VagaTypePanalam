/**
 * VaagaTypePanalam — English Word Bank
 *
 * Words organized by which key they exercise.
 * Used by the adaptive text generator to build practice text
 * that targets specific weak keys.
 */

export const ENGLISH_WORDS_BY_KEY: Map<string, string[]> = new Map([
  // Home Row
  ['f', ['fun', 'fly', 'off', 'life', 'find', 'fast', 'self', 'free', 'from', 'for', 'fit', 'fix', 'fish', 'flat', 'fill', 'fall', 'feel', 'fine', 'flag', 'fold']],
  ['j', ['just', 'joy', 'join', 'jump', 'job', 'jam', 'jet', 'joke', 'jail', 'jolt', 'jazz', 'jug', 'jaw', 'jab']],
  ['d', ['did', 'day', 'add', 'dark', 'do', 'dip', 'deep', 'dog', 'door', 'desk', 'dust', 'deal', 'down', 'dry', 'draw', 'dose', 'dash']],
  ['k', ['key', 'kid', 'kind', 'king', 'kit', 'kick', 'keep', 'kite', 'knot', 'know', 'keen', 'knob', 'knee']],
  ['s', ['see', 'sad', 'sit', 'sun', 'set', 'say', 'she', 'six', 'sky', 'sea', 'son', 'stop', 'step', 'side', 'slow', 'sold', 'safe', 'same', 'sand', 'send']],
  ['l', ['let', 'lot', 'low', 'led', 'lay', 'lip', 'lag', 'log', 'lid', 'lad', 'lap', 'lab', 'leg', 'lie', 'lit', 'live', 'like', 'last', 'late', 'left']],
  ['a', ['and', 'all', 'ask', 'add', 'age', 'ago', 'air', 'aim', 'arm', 'art', 'any', 'act', 'are', 'had', 'was', 'far', 'ran', 'gap', 'map', 'cap']],
  [';', ['ask', 'all', 'add', 'age', 'and']],
  ['g', ['go', 'get', 'got', 'gap', 'gas', 'leg', 'big', 'dig', 'dog', 'fog', 'log', 'bag', 'bug', 'tag', 'jog', 'egg', 'fig', 'gig']],
  ['h', ['he', 'his', 'has', 'had', 'how', 'hot', 'hid', 'him', 'hit', 'hop', 'hug', 'hat', 'hen', 'hem', 'hip', 'hub', 'hue']],

  // Top Row
  ['r', ['run', 'red', 'row', 'raw', 'rid', 'ram', 'rug', 'rip', 'rot', 'rod', 'rap', 'rat', 'rib', 'rim', 'rub', 'rise', 'rain', 'read', 'real', 'rest']],
  ['u', ['up', 'us', 'use', 'urn', 'run', 'sun', 'fun', 'gun', 'bun', 'but', 'bus', 'bug', 'cup', 'cut', 'dug', 'hub', 'hum', 'jug', 'mud', 'tug']],
  ['e', ['ear', 'eat', 'end', 'egg', 'eel', 'eye', 'elf', 'elm', 'era', 'eve', 'ebb', 'bed', 'let', 'set', 'net', 'pet', 'ten', 'pen', 'den', 'men']],
  ['i', ['in', 'is', 'it', 'if', 'ink', 'ice', 'ill', 'bid', 'big', 'bit', 'dig', 'did', 'dim', 'dip', 'fig', 'fin', 'fit', 'fix', 'hid', 'him']],
  ['w', ['we', 'was', 'web', 'wet', 'who', 'why', 'win', 'wit', 'wax', 'way', 'war', 'wow', 'wok', 'won', 'woe', 'wig', 'wish', 'wide', 'wild', 'will']],
  ['o', ['on', 'or', 'of', 'old', 'one', 'out', 'own', 'oil', 'odd', 'off', 'oak', 'oar', 'oat', 'ore', 'owl', 'box', 'boy', 'cob', 'cod', 'cog']],
  ['t', ['to', 'the', 'top', 'ten', 'tip', 'tie', 'tin', 'toe', 'ton', 'too', 'two', 'tab', 'tag', 'tan', 'tap', 'tar', 'tax', 'tea', 'tell', 'test']],
  ['y', ['yes', 'yet', 'yam', 'yap', 'you', 'yew', 'boy', 'buy', 'cry', 'day', 'dry', 'dye', 'eye', 'fly', 'fry', 'gay', 'guy', 'hay', 'joy', 'key']],
  ['q', ['quit', 'quiz', 'quad', 'quay']],
  ['p', ['put', 'pay', 'pen', 'pet', 'pie', 'pin', 'pit', 'pop', 'pot', 'pad', 'pal', 'pan', 'paw', 'pea', 'peg', 'pig', 'pod', 'pry', 'pub', 'pug']],

  // Bottom Row
  ['v', ['van', 'vat', 'vet', 'via', 'vim', 'vow', 'vie', 'give', 'have', 'live', 'love', 'move', 'save', 'five', 'dive', 'gave', 'wave', 'cave', 'vine', 'vast']],
  ['m', ['me', 'my', 'man', 'map', 'mat', 'may', 'men', 'met', 'mid', 'mix', 'mob', 'mop', 'mud', 'mug', 'hum', 'jam', 'ram', 'sum', 'yam', 'arm']],
  ['b', ['be', 'bed', 'bet', 'bid', 'big', 'bit', 'box', 'boy', 'bud', 'bug', 'bun', 'bus', 'but', 'buy', 'cab', 'cob', 'cub', 'dab', 'hub', 'jab']],
  ['n', ['no', 'net', 'new', 'nod', 'nor', 'not', 'now', 'nun', 'nut', 'nap', 'nib', 'nip', 'ban', 'bin', 'can', 'den', 'fan', 'fin', 'fun', 'gun']],
  ['c', ['can', 'cap', 'car', 'cat', 'cab', 'cod', 'cog', 'cop', 'cow', 'cry', 'cub', 'cud', 'cup', 'cur', 'cut', 'ace', 'ice', 'act', 'arc', 'each']],
  [',', ['and', 'the', 'for', 'but', 'with', 'this', 'that', 'from', 'have']],
  ['x', ['ax', 'box', 'fix', 'fox', 'hex', 'max', 'mix', 'pox', 'six', 'tax', 'vex', 'wax', 'axe', 'exit', 'exam', 'next', 'text', 'flex']],
  ['.', ['the', 'and', 'for', 'was', 'not', 'but', 'are', 'can', 'had', 'all']],
  ['z', ['zap', 'zen', 'zip', 'zoo', 'zone', 'zero', 'zinc', 'zeal', 'fizz', 'fuzz', 'jazz', 'buzz', 'maze', 'haze', 'gaze']],
  ['/', ['the', 'and', 'for', 'was', 'not', 'but', 'are', 'can']],

  // Space (common short words)
  [' ', ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'it', 'is', 'was', 'for', 'on', 'are', 'as', 'at', 'he', 'by', 'or', 'an', 'do']],
]);
