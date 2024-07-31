import { useEffect, useState } from 'react'
import './App.css'
import {solve} from './solver';

function App() {
  const [side1, setSide1] = useState('')
  const [side2, setSide2] = useState('')
  const [side3, setSide3] = useState('')
  const [side4, setSide4] = useState('')
  const [hasChanged, setHasChanged] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [solutions, setSolutions] = useState<string[][]>([]);

  useEffect(() => {
    if (hasChanged) {
      setSolutions([]);
    }
  }, [hasChanged])

  async function runSolver() {
    setLoading(true);
    try {
      solve([side1, side2, side3, side4], (newMessage) => setMessage(newMessage), (newSolutions) => setSolutions(newSolutions)).then(() => {
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
      <a href="https://www.nytimes.com/puzzles/letter-boxed">Play Letterboxed</a>
      <a href="https://unscrambleit.net/letterboxed-nyt/">Play Letterboxed Unlimited</a>
      <div className="card">
        <input
          type="text"
          placeholder="side 1"
          value={side1}
          onChange={(event) => {
            if (event.target.value.length <= 3) {
              setSide1(event.target.value);
              setHasChanged(true);
            }
          }}
        />
        <input
          type="text"
          placeholder="side 2"
          value={side2}
          onChange={(event) => {
            if (event.target.value.length <= 3) {
              setSide2(event.target.value);
              setHasChanged(true);
            }
          }}
        />
        <input
          type="text"
          placeholder="side 3"
          value={side3}
          onChange={(event) => {
            if (event.target.value.length <= 3) {
              setSide3(event.target.value);
              setHasChanged(true);
            }
          }}
          />
        <input
          type="text"
          placeholder="side 4"
          value={side4}
          onChange={(event) => {
            if (event.target.value.length <= 3) {
              setSide4(event.target.value);
              setHasChanged(true);
            }
          }}
        />
      </div>
      <button onClick={runSolver}>Solve</button>
      {!loading && !hasChanged && <div>
        <h2>Solutions:</h2>
          {solutions.slice(0, 100).map((solution, index) => (
            <p key={index}>{solution.join(', ')}</p>
          ))}
      </div>}
      {loading && <div>Loading...</div>}
      {loading && <div>{message}</div>}
    </>
  )
}

export default App;
