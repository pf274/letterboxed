const prompt = require('prompt');
const fs = require('fs');
const readline = require('readline');

const letters = new Array(26).fill(0).map((_, i) => String.fromCharCode(97 + i));

function readLines(filename, startLine, numLines, lineHandler, closeHandler) {
  let lineNum = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(filename),
    crlfDelay: Infinity
  });

  rl.on('line', (line) => {
    if (lineNum >= startLine && lineNum < startLine + numLines + 1) {
      lineHandler(line, lineNum);
    }
    lineNum++;
  });

  rl.on('close', closeHandler);
}

const starters = {};

async function prepareStarters() {
  await new Promise((resolve) => {
    readLines('wordlist.10000.txt', 0, 274411, (line, lineNum) => {
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

async function getWordsStartingWith(starter) {
  const truncatedStarter = starter.slice(0, 2);
  const starterValues = Object.values(starters).sort((a, b) => a - b);
  const words = await new Promise((resolve) => {
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
    const numLines = endLine - startLine + 1;
    const words = [];
    readLines('wordlist.10000.txt', startLine, numLines, (line) => {
      words.push(line);
    }, () => {
      resolve(words);
    });
  });
  if (starter.length <= 2) {
    return words;
  }
  return words.filter(word => word.startsWith(starter));
}

const sides = new Array(4).fill("");

async function getSides() {
  prompt.start();
  await new Promise((resolve) => {
    prompt.get(['side 1', 'side 2', 'side 3', 'side 4'], (err, result) => {
      if (err) {
        console.log('Error:', err);
        return;
      }
      sides[0] = result['side 1'];
      sides[1] = result['side 2'];
      sides[2] = result['side 3'];
      sides[3] = result['side 4'];
      resolve(true);
    });
  });
  for (let index = 0; index < sides.length; index++) {
    sides[index] = sides[index].replace(/\s/g, '').toLowerCase().split('');
    if (sides[index].length !== 3) {
      throw new Error('Invalid input. Each side must have three letters. Enter like this: \'wvs\'');
    }
  }
}

const possibleWords = [];

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

let wordCombos = [];

async function getWordCombos() {
  const routes = [...possibleWords.map((word) => [word])];
  while (routes.length > 0) {
    const route = routes.shift();
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
  wordCombos = wordCombos.sort((a, b) => a.length - b.length);
}

async function showMore() {
  return new Promise((resolve, reject) => {
    prompt.start();

    const schema = {
      properties: {
        continue: {
          description: 'Do you want to see more results? (yes/no)',
          pattern: /^(yes|no)$/,
          message: 'Please answer with "yes" or "no".',
          required: true
        }
      }
    };

    prompt.get(schema, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result.continue === 'yes');
      }
    });
  });
}

async function solve() {
  console.log('Preparing starters...');
  await prepareStarters();
  console.log('Getting sides...');
  await getSides();
  console.log('Finding all possible words...');
  await getAllPossibleWords();
  console.log('Getting word combos...');
  await getWordCombos();
  console.log('Presenting results...');
  let startIndex = 0;
  let batch = wordCombos.slice(startIndex, startIndex + 10);
  while (batch.length > 0) {
    console.log('Batch:', startIndex / 10 + 1);
    console.log('-------------------');
    batch.forEach((combo) => {
      console.log(combo.join(', '));
    });
    startIndex += 10;
    batch = wordCombos.slice(startIndex, startIndex + 10);
    const shouldShowMore = await showMore();
    if (!shouldShowMore) {
      break;
    }
  }
  console.log('Mission accomplished. Have a nice day! :)');
}

solve();