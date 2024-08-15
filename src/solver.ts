const wordListSource = 'https://gist.githubusercontent.com/pf274/0ea2c3a76dee34480179100cdba6b501/raw/eec4a7dc32abeab3c27edb0952a69265f2b8d8aa/wordlist.txt';

async function getWordList() {
  const wordList: string[] = (await fetch(wordListSource).then(response => response.text())).split('\n');
  return wordList;
}

const letters = new Array(26).fill(0).map((_, i) => String.fromCharCode(97 + i));

async function prepareStarters(wordList: string[]) {
  const starters: Record<string, any> = {};
  for (let i = 0; i < wordList.length; i++) {
    const word = wordList[i].trim();
    if (word.length == 1) {
      if (!starters[word.charAt(0)]) {
        starters[word.charAt(0)] = i;
      }
      continue;
    } else if (word.length >= 2) {
      if (!starters[word.charAt(0)]) {
        starters[word.charAt(0)] = i;
      }
      const wordStart = word.slice(0, 2);
      if (!starters[wordStart]) {
        starters[wordStart] = i;
      }
      continue;
    }
  }
  return starters;
}

async function getWordsStartingWith(starter: string, starters: Record<string, any>, wordList: string[]) {
  const truncatedStarter = starter.slice(0, 2);
  const starterValues = Object.values(starters).sort((a, b) => a - b);
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
  const wordsToReturn: string[] = wordList.slice(startLine, endLine + 1);
  if (starter.length <= 2) {
    return wordsToReturn;
  }
  return wordsToReturn.filter(word => word.startsWith(starter));
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

async function getAllPossibleWords(starters: Record<string, any>, sides: string[][], wordList: string[]) {
  const possibleWords: string[] = [];
  const routes = sides.flat();
  while (routes.length > 0) {
    const route = routes.shift()!;
    if (route.length <= 2) {
      // console.log('Checking words starting with:', route);
    }
    const words = await getWordsStartingWith(route, starters, wordList);
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
  const wordList = await getWordList();
  progressHandler('Preparing starters...');
  const starters = await prepareStarters(wordList);
  progressHandler('Formatting sides...');
  const sides = await formatSides(inputSides);
  progressHandler('Finding all possible words...');
  const words = await getAllPossibleWords(starters, sides, wordList);
  console.log('Getting word combos...');
  const wordCombos = await getWordCombos(words);
  console.log('Presenting results...');
  console.log('Mission accomplished. Have a nice day! :)');
  resultHandler(wordCombos);
}