const wordListSource = 'https://gist.githubusercontent.com/pf274/0ea2c3a76dee34480179100cdba6b501/raw/eec4a7dc32abeab3c27edb0952a69265f2b8d8aa/wordlist.txt';

enum LETTER_TYPE {
  a = 'a',
  b = 'b',
  c = 'c',
  d = 'd',
  e = 'e',
  f = 'f',
  g = 'g',
  h = 'h',
  i = 'i',
  j = 'j',
  k = 'k',
  l = 'l',
  m = 'm',
  n = 'n',
  o = 'o',
  p = 'p',
  q = 'q',
  r = 'r',
  s = 's',
  t = 't',
  u = 'u',
  v = 'v',
  w = 'w',
  x = 'x',
  y = 'y',
  z = 'z',
  empty = '',
}

class WordNode {
  private wordSection: string;
  public isWord: boolean;
  private children: Record<LETTER_TYPE, WordNode>;
  private constructor(wordSection: string, isWord: boolean) {
    this.wordSection = wordSection;
    this.isWord = isWord;
    this.children = {} as Record<LETTER_TYPE, WordNode>;
  }
  addChild(childLetter: LETTER_TYPE, isWord: boolean) {
    this.children[childLetter] = new WordNode(`${this.wordSection}${childLetter}`, isWord);
  }
  getChild(childLetter: LETTER_TYPE) {
    return this.children[childLetter];
  }
  get word() {
    if (this.isWord) {
      return this.wordSection;
    }
    return null;
  }
  static createRoot() {
    return new WordNode('', false);
  }
  hasNode(wordSection: string) {
    let currentNode: WordNode = this;
    for (let i = 0; i < wordSection.length; i++) {
      const letter = wordSection.charAt(i) as LETTER_TYPE;
      if (!currentNode.children[letter]) {
        return false;
      }
      currentNode = currentNode.children[letter];
    }
    return true;
  }
  getNode(wordSection: string) {
    let currentNode: WordNode = this;
    for (let i = 0; i < wordSection.length; i++) {
      const letter = wordSection.charAt(i) as LETTER_TYPE;
      if (!currentNode.children[letter]) {
        return null;
      }
      currentNode = currentNode.children[letter];
    }
    return currentNode;
  }
  getAllWords() {
    let words: string[] = [];
    if (this.isWord) {
      words.push(this.wordSection);
    }
    for (const letter in this.children) {
      words = [...words, ...this.children[letter as LETTER_TYPE].getAllWords()];
    }
    return words;
  }
}


async function getWordTrie() {
  const wordList: string[] = (await fetch(wordListSource).then(response => response.text())).split('\n').map((word) => word.trim().toLowerCase().replace(/[^a-z]/g, ''));
  const wordTrie = WordNode.createRoot();
  wordList.forEach((word) => {
    let currentNode = wordTrie;
    for (let i = 0; i < word.length; i++) {
      const letter = word.charAt(i) as LETTER_TYPE;
      if (!currentNode.getChild(letter)) {
        currentNode.addChild(letter, i == word.length - 1);
      } else if (i == word.length - 1) {
        currentNode.getChild(letter).isWord = true;
      }
      currentNode = currentNode.getChild(letter);
    }
  });
  return wordTrie;
}

async function getWordsStartingWith(starter: string, wordTrie: WordNode) {
  const wordNode = wordTrie.getNode(starter);
  if (wordNode) {
    return wordNode.getAllWords();
  } else {
    return [];
  }
}


async function formatSides(inputSides: string[]) {
  const sides = new Array(4).fill("");
  sides[0] = inputSides[0];
  sides[1] = inputSides[1];
  sides[2] = inputSides[2];
  sides[3] = inputSides[3];
  for (let index = 0; index < sides.length; index++) {
    sides[index] = sides[index].replace(/\s/g, '').toLowerCase().split('');
    if (sides[index].length !== 3) {
      throw new Error('Invalid input. Each side must have three letters. Enter like this: \'wvs\'');
    }
  }
  return sides;
}

async function getAllPossibleWords(sides: string[][], wordTrie: WordNode) {
  const possibleWords: string[] = [];
  const routes = sides.flat();
  while (routes.length > 0) {
    const route = routes.shift()!;
    if (route.length <= 2) {
      // console.log('Checking words starting with:', route);
    }
    const words = await getWordsStartingWith(route, wordTrie);
    if (words.includes(route) && route.length >= 3) {
      // console.log('Found word:', route);
      possibleWords.push(route);
    }
    if (words.length > 0) {
      const otherSides = sides.filter(side => !side.includes(route.charAt(route.length - 1)));
      const availableLetters = otherSides.flat();
      const nextRoutes = availableLetters.map((letter) => route + letter);
      routes.unshift(...nextRoutes);
    }
  }
  return possibleWords;
}


async function getWordCombos(possibleWords: string[]) {
  let wordCombos: string[][] = [];
  const routes = [...possibleWords.map((word) => [word])];
  while (routes.length > 0) {
    const route: string[] = routes.shift() as string[];
    const lettersCovered = new Set(route.join('').split(''));
    if (lettersCovered.size == 12) {
      // console.log('Found word combo:', route);
      wordCombos.push(route);
      continue;
    } else if (route.length >= 5) {
      continue;
    }
    const lastWord = route[route.length - 1];
    const lastLetter = lastWord.charAt(lastWord.length - 1);
    const availableWords = possibleWords.filter(word => word.startsWith(lastLetter) && !route.includes(word));
    const nextRoutes = availableWords.map((word) => [...route, word]);
    routes.unshift(...nextRoutes);
  }
  wordCombos = wordCombos.sort((a, b) => {
    if (a.length !== b.length) {
      return a.length - b.length;
    }
    const minALength = Math.min(...a.map(word => word.length));
    const minBLength = Math.min(...b.map(word => word.length));
    return minBLength - minALength;
  });
  return wordCombos;
}

export async function solve(inputSides: string[], progressHandler: (message: string) => void, resultHandler: (result: string[][]) => void) {
  const wordTrie = await getWordTrie();
  progressHandler('Formatting sides...');
  const sides = await formatSides(inputSides);
  progressHandler('Finding all possible words...');
  const words = await getAllPossibleWords(sides, wordTrie);
  console.log('Getting word combos...');
  const wordCombos = await getWordCombos(words);
  console.log('Presenting results...');
  console.log('Mission accomplished. Have a nice day! :)');
  resultHandler(wordCombos);
}