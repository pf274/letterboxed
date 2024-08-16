import { useEffect, useRef, useState } from 'react'
import './App.css'
import {solve} from './solver';
import SideEntry from './components/SideEntry';
import { Button, List, ListItem, Table, TableBody, TableCell, TableRow, TextField } from '@mui/material';

function App() {
  const sides = useRef<string[]>(['', '', '', '']);
  const [hasChanged, setHasChanged] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [solutions, setSolutions] = useState<string[][]>([]);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [wordsToExclude, setWordsToExclude] = useState('');
  const [wordsToInclude, setWordsToInclude] = useState('');
  const [filteredSolutions, setFilteredSolutions] = useState<string[][]>([]);
  const debounce = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounce.current) {
      clearTimeout(debounce.current);
    }
    debounce.current = setTimeout(() => {
      if (solutions.length > 0) {
        setFilteredSolutions(filterSolutions());
      } else {
        setFilteredSolutions([]);
      }
    }, 1000);
  }, [solutions, wordsToExclude, wordsToInclude]);

  function handleUpdateExclude(event: React.ChangeEvent<HTMLInputElement>) {
    const newWordsToExclude = event.target.value.toLowerCase().replace(/[^a-z ]/g, '');
    setWordsToExclude(newWordsToExclude);
    setSolutionIndex(0);
  }

  function handleUpdateInclude(event: React.ChangeEvent<HTMLInputElement>) {
    const newWordsToInclude = event.target.value.toLowerCase().replace(/[^a-z ]/g, '');
    setWordsToInclude(newWordsToInclude);
    setSolutionIndex(0);
  }

  function filterSolutions() {
    const notExcluded = solutions.filter((solution) => !solution.some((word) => wordsToExclude.split(' ').filter((segment) => segment.length > 0).includes(word)));
    return notExcluded.filter((solution) => wordsToInclude.split(' ').filter((segment) => segment.length > 0).every((word) => solution.includes(word)));
  }

  function getMostEfficientSolution() {
    if (filteredSolutions.length == 0) {
      return [];
    }
    return filteredSolutions.sort((a, b) => a.join('').length - b.join('').length)[0];
  }

  function getMostElaborateSolution() {
    if (filteredSolutions.length == 0) {
      return [];
    }
    return filteredSolutions.sort((a, b) => b.join('').length - a.join('').length)[0];
  }

  useEffect(() => {
    if (hasChanged) {
      setSolutions([]);
      setSolutionIndex(0);
    }
  }, [hasChanged])

  async function runSolver() {
    setLoading(true);
    try {
      const wordCombos = await solve(sides.current);
      setSolutions(wordCombos);
      setHasChanged(false);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <h1>Letterboxed Solver</h1>
      <p>
        <a href="https://www.nytimes.com/puzzles/letter-boxed">Play Letterboxed</a>
      </p>
      <p>
        <a href="https://unscrambleit.net/letterboxed-nyt/">Play Letterboxed Unlimited</a>
      </p>
      <div className="card" style={{display: 'flex', flexDirection: 'row', gap: '1em'}}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell/>
              <TableCell>
                <SideEntry onChange={(newSideValue) => {
                  sides.current[0] = newSideValue;
                  setHasChanged(true);
                }} name="side 1" orientation="horizontal" />
              </TableCell>
              <TableCell/>
            </TableRow>
            <TableRow>
              <TableCell>
                <SideEntry onChange={(newSideValue) => {
                  sides.current[1] = newSideValue;
                  setHasChanged(true);
                }} name="side 2" orientation="vertical"/>
              </TableCell>
              <TableCell />
              <TableCell>
                <SideEntry onChange={(newSideValue) => {
                  sides.current[2] = newSideValue;
                  setHasChanged(true);
                }} name="side 3" orientation="vertical"/>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell/>
              <TableCell>
                <SideEntry onChange={(newSideValue) => {
                  sides.current[3] = newSideValue;
                  setHasChanged(true);
                }} name="side 4" orientation="horizontal"/>
              </TableCell>
              <TableCell/>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <Button variant="contained" onClick={runSolver} disabled={loading}>Solve</Button>

      {!loading && !hasChanged && <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1em'}}>
        <h2 style={{margin: 0, marginTop: '1em'}}>Solutions:</h2>
          <TextField label="Words to exclude" value={wordsToExclude} onChange={handleUpdateExclude}></TextField>
          <TextField label="Words to include" value={wordsToInclude} onChange={handleUpdateInclude}></TextField>
          <h3 style={{margin: 0, padding: 0}}>Most efficient solution:</h3>
          <p style={{margin: 0, padding: 0}}>{getMostEfficientSolution().join(', ')}</p>
          <h3 style={{margin: 0, padding: 0}}>Most elaborate solution:</h3>
          <p style={{margin: 0, padding: 0}}>{getMostElaborateSolution().join(', ')}</p>
          <h3 style={{margin: 0, padding: 0}}>All Solutions:</h3>
          <List dense={true} style={{backgroundColor: '#eeeeee', borderRadius: '1em'}}>
            {filteredSolutions.slice(solutionIndex, solutionIndex + 100).map((solution, index) => (
              <ListItem key={index}>{solution.join(', ')}</ListItem>
            ))}
          </List>
          {filteredSolutions.length == 0 && <p>No solutions found.</p>}
          {filteredSolutions.length != 0 && filteredSolutions.slice(solutionIndex, solutionIndex + 100).length == 0 && <p>There are no more solutions.</p>}
          <div style={{display: 'flex', flexDirection: 'row', gap: '1em'}}>
            {solutionIndex > 0 && <button onClick={() => setSolutionIndex(Math.max(0, solutionIndex - 100))}>Go Back</button>}
            <p>{Math.floor(solutionIndex / 100) + 1}/{Math.ceil(filteredSolutions.length / 100)}</p>
            {solutionIndex < filteredSolutions.length && <button onClick={() => setSolutionIndex(Math.min(filteredSolutions.length, solutionIndex + 100))}>See more</button>}
          </div>
      </div>}
      {loading && <div>Loading...</div>}
      {loading && <div>{message}</div>}
    </>
  )
}

export default App;
