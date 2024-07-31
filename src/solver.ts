const wordListSource = 'https://gist.githubusercontent.com/pf274/0ea2c3a76dee34480179100cdba6b501/raw/eec4a7dc32abeab3c27edb0952a69265f2b8d8aa/wordlist.txt';

let wordList: string;

async function getWordList() {
  if (wordList) {
    return;
  }
  wordList = await fetch(wordListSource).then(response => response.text());
  console.log('Word list loaded.');
}

const letters = new Array(26).fill(0).map((_, i) => String.fromCharCode(97 + i));

function readLines(content: string, startLine: number, numLines: number, lineHandler: (line: string, lineNum: number) => any, closeHandler: (...params: any[]) => any) {
  const lines = content.split('\n');
  for (let lineNum = startLine; lineNum < startLine + numLines && lineNum < lines.length; lineNum++) {
    lineHandler(lines[lineNum], lineNum);
  }
  closeHandler();
}

const starters: Record<string, any> = {};

async function prepareStarters() {
  await new Promise((resolve) => {
    readLines(wordList, 0, 274411, (line, lineNum) => {
      const word = line.trim();
      if (word.length == 1) {
        if (!starters[word.charAt(0)]) {
          starters[word.charAt(0)] = lineNum;
        }
        return;
      } else if (word.length >= 2) {
        if (!starters[word.charAt(0)]) {
          starters[word.charAt(0)] = lineNum;
        }
        const wordStart = word.slice(0, 2);
        if (!starters[wordStart]) {
          starters[wordStart] = lineNum;
        }
        return;
      }
    }, () => {
      resolve(true);
    });
  })
}

async function getWordsStartingWith(starter: string) {
  const truncatedStarter = starter.slice(0, 2);
  const starterValues = Object.values(starters).sort((a, b) => a - b);
  const words: string[] = await new Promise((resolve) => {
    let startLine;
    let endLine;
    if (truncatedStarter.length == 2) {
      startLine = starters[truncatedStarter] ? starters[truncatedStarter] : starters[starter.charAt(0)];
      const startIndex = starterValues.indexOf(startLine);
      let endIndex = startIndex;
      do {
        endIndex++;
        endLine = starterValues[endIndex];
      } while (endLine == startLine);
    } else {
      startLine = starters[starter.charAt(0)];
      const nextLetter = letters[letters.indexOf(starter.charAt(0)) + 1];
      endLine = starters[nextLetter];
    }
    const numLines = endLine - startLine;
    const wordsToReturn: string[] = [];
    readLines(wordList, startLine, numLines, (line) => {
      wordsToReturn.push(line);
    }, () => {
      resolve(wordsToReturn);
    });
  });
  if (starter.length <= 2) {
    return words;
  }
  return words.filter(word => word.startsWith(starter));
}

const sides = new Array(4).fill("");

async function formatSides(inputSides: string[]) {
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
}

const possibleWords: string[] = [];

async function getAllPossibleWords() {
  const routes = sides.flat();
  while (routes.length > 0) {
    const route = routes.shift();
    if (route.length <= 2) {
      // console.log('Checking words starting with:', route);
    }
    const words = await getWordsStartingWith(route);
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
}

let wordCombos: string[][] = [];

async function getWordCombos() {
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
}

export async function solve(inputSides: string[], progressHandler: (message: string) => void, resultHandler: (result: string[][]) => void) {
  await getWordList();
  progressHandler('Preparing starters...');
  await prepareStarters();
  progressHandler('Formatting sides...');
  await formatSides(inputSides);
  progressHandler('Finding all possible words...');
  getAllPossibleWords().then(() => {
    console.log('Getting word combos...');
    getWordCombos().then(() => {
      console.log('Presenting results...');
      console.log('Mission accomplished. Have a nice day! :)');
      resultHandler(wordCombos);
    })
  })
}