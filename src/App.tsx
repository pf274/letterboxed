import { useEffect, useRef, useState } from 'react'
import './App.css'
import {solve} from './solver';
import SideEntry from './components/SideEntry';
import { List, ListItem, Table, TableBody, TableCell, TableRow, TextField } from '@mui/material';

function App() {
  const sides = useRef<string[]>(['', '', '', '']);
  const [hasChanged, setHasChanged] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [solutions, setSolutions] = useState<string[][]>([]);
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [wordsToExclude, setWordsToExclude] = useState('');

  function handleUpdateExclude(event: React.ChangeEvent<HTMLInputElement>) {
    const newWordsToExclude = event.target.value.toLowerCase().replace(/[^a-z ]/g, '');
    setWordsToExclude(newWordsToExclude);
    setSolutionIndex(0);
  }

  function getSolutions() {
    return solutions.filter((solution) => !solution.some((word) => wordsToExclude.split(' ').filter((segment) => segment.length > 0).includes(word)));
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
      solve(sides.current, (newMessage) => setMessage(newMessage), (newSolutions) => setSolutions(newSolutions)).then(() => {
        setHasChanged(false);
        setLoading(false);
      }).catch((err) => {
        console.error(err);
      });
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
      <button onClick={runSolver}>Solve</button>

      {!loading && !hasChanged && <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1em'}}>
        <h2 style={{margin: 0, marginTop: '1em'}}>Solutions:</h2>
          <TextField label="Words to exclude" value={wordsToExclude} onChange={handleUpdateExclude}></TextField>
          <List dense={true} style={{backgroundColor: '#eeeeee', borderRadius: '1em'}}>
            {getSolutions().slice(solutionIndex, solutionIndex + 100).map((solution, index) => (
              <ListItem key={index}>{solution.join(', ')}</ListItem>
            ))}
          </List>
          {getSolutions().length == 0 && <p>No solutions found.</p>}
          {getSolutions().length != 0 && getSolutions().slice(solutionIndex, solutionIndex + 100).length == 0 && <p>There are no more solutions.</p>}
          <div style={{display: 'flex', flexDirection: 'row', gap: '1em'}}>
            {solutionIndex > 0 && <button onClick={() => setSolutionIndex(Math.max(0, solutionIndex - 100))}>Go Back</button>}
            <p>{Math.floor(solutionIndex / 100) + 1}/{Math.ceil(getSolutions().length / 100)}</p>
            {solutionIndex < getSolutions().length && <button onClick={() => setSolutionIndex(Math.min(getSolutions().length, solutionIndex + 100))}>See more</button>}
          </div>
      </div>}
      {loading && <div>Loading...</div>}
      {loading && <div>{message}</div>}
    </>
  )
}

export default App;
