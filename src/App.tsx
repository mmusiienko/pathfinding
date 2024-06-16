import { SetStateAction, useEffect, useState } from 'react';
import './App.css';
import { CellValue, Gen, TGrid } from './types';
import { astar, bfs, dfs, djikstra } from './algos';
import { generate } from './gen';
import { Grid } from './grid';

const W = Math.floor((window.screen.width - 300) / 24)
const H = Math.floor(window.screen.height / 27)

export const N_BRIDGES = 3
export const N_RIVERS = 4

export const R_WIDTH = 2

const CellValues = Object.keys(CellValue).slice(Object.keys(CellValue).length / 2)
const GenValues = Object.keys(Gen).slice(Object.keys(Gen).length / 2)
const GenIntValues = Object.keys(Gen).slice(0, Object.keys(Gen).length / 2)

export const valToColor = ["bg-green-700", "bg-blue-500", "bg-pink-500", "bg-pink-400", "bg-yellow-950"]

export const valToColorHex = ["#15803d", "#3b82f6", "#ec4899", "#f472b6", "#422006"]

const visitedSupplier = () => Array.from({ length: H }, () => Array(W).fill(-1))
const pathSupplier = () => Array.from({ length: H }, () => Array(W).fill(false))
const unweightedSupplier = () => Array.from({ length: H }, () => Array(W).fill(0).map(i => 1))
const weightedSupplier = () => Array.from({ length: H }, () => Array(W).fill(0).map(i => Math.floor(Math.random() * 3) + 1))
const gridSupplier = () => Array.from({ length: H }, () => Array(W).fill(CellValue.GRASS))
const currentNodeSupplier = (): [number, number] => [-1, -1]

let stopFlag = false
const shouldStop = () => stopFlag

const App = () => {
  const [grid, setGrid] = useState<TGrid>(gridSupplier())
  const [gen, setGen] = useState<Gen>(Gen.RIVERS)
  const [weightSupplier, setWeightSupplier] = useState<() => number[][]>(() => weightedSupplier)
  const [visited, setVisited] = useState<number[][]>(visitedSupplier())
  const [weights, setWeights] = useState<number[][]>(weightSupplier())
  const [path, setPath] = useState<boolean[][]>(pathSupplier())

  const [algorithm, setAlgorithm] = useState<(shouldAnimate: boolean) => void>()
  const [isAlgoRunning, setAlgoRunning] = useState<boolean>(false)

  const [currentNode, setCurrentNode] = useState<[number, number]>(currentNodeSupplier())

  const [size, setSize] = useState<number>(1)

  const [drawingColor, setDrawingColor] = useState<CellValue>(CellValue.SOURCE)
  const [secDrawingColor, setSecDrawingColor] = useState<CellValue>(CellValue.TARGET)

  const [shouldAnimate, setShouldAnimate] = useState<boolean>(true)
  const [animSpeed, setAnimSpeed] = useState<number>(0)

  const clear = () => {
    setVisited(visitedSupplier())
    setPath(pathSupplier())
    setCurrentNode(currentNodeSupplier())
    setShouldAnimate(true)
    setAlgorithm(undefined)
  }

  useEffect(() => {
    if (algorithm && !isAlgoRunning) {
      stopFlag = false
      setAlgoRunning(true)
      algorithm(shouldAnimate)
      setShouldAnimate(false)
    }
  }, [algorithm, grid])

  useEffect(() => setWeights(weightSupplier()), [weightSupplier])



  const runAlgo = (algo: (shouldAnimate: boolean) => Promise<void>) => {
    setAlgorithm(
      () => async (shouldAnimate: boolean) => {
        setShouldAnimate(true)
        await algo(shouldAnimate)
        setAlgoRunning(false)
      }
    )
  }

  return (
    <div className="App flex items-center z-50 justify-center border border-black rounded-xl h-screen w-screen">
      <header className="App-header flex space-x-2">
        <Grid
          grid={grid}
          setGrid={setGrid}
          drawingColor={drawingColor}
          secDrawingColor={secDrawingColor}
          targetSize={size}
          currentNode={currentNode}
          path={path}
          visited={visited}
          weights={weights}
          clear={clear}
          gen={gen}
        />
        <div className='flex flex-col space-y-1 text-white'>
          {CellValues.map((color, i) =>
            <button
              key={i} className={`w-24 h-24 hover:scale-105 rounded-md ${valToColor[i]}`}
              onContextMenu={(e) => {
                e.preventDefault()

                document.body.style.setProperty(`--hoverclr`, `${valToColorHex[i]}`)
                setSecDrawingColor(i)
              }}
              onClick={(e) => {
                document.body.style.setProperty(`--hoverclr`, `${valToColorHex[i]}`)

                setDrawingColor(i)
              }}
            >{color}</button>
          )}
          <button
            className={`w-40 h-10 hover:scale-110 rounded-md bg-black text-white`}
            onClick={() =>
              runAlgo(async (shouldAnimate: boolean) => await dfs(
                grid,
                setCurrentNode,
                setVisited,
                setPath,
                size,
                shouldAnimate,
                animSpeed,
                shouldStop
              ))
            }
          >DFS</button>
          <button
            className={`w-40 h-10 hover:scale-110 rounded-md bg-black text-white`}
            onClick={() => runAlgo(
              async (shouldAnimate: boolean) => await bfs(
                grid,
                setCurrentNode,
                setVisited,
                setPath,
                size,
                shouldAnimate,
                animSpeed,
                shouldStop
              ))}
          >BFS</button>
          <button
            className={`w-40 h-10 hover:scale-110 rounded-md bg-black text-white`}
            onClick={() =>
              runAlgo(
                async (shouldAnimate: boolean) => {
                  await djikstra(
                    grid,
                    setCurrentNode,
                    setVisited,
                    setPath,
                    weights,
                    size,
                    shouldAnimate,
                    animSpeed,
                    shouldStop
                  )
                }
              )
            }
          >Dijkstra</button>
          <button
            className={`w-40 h-10 hover:scale-110 rounded-md bg-black text-white`}
            onClick={() =>
              runAlgo(async (shouldAnimate: boolean) => {
                await astar(
                  grid,
                  setCurrentNode,
                  setVisited,
                  setPath,
                  weights,
                  size,
                  shouldAnimate,
                  animSpeed,
                  shouldStop
                )
              })}
          >A*</button>
          <button
            className={`w-40  h-10 hover:scale-110 rounded-md bg-black text-white`}
            onClick={() => {
              clear()
              setGrid(gridSupplier())
              setWeights(weightSupplier())
              setAlgorithm(undefined)
              generate(gen, setGrid, size)
            }}
          >Re-generate</button>
          <select value={gen} className='bg-black w-40 h-10 rounded-md p-2' onChange={(e) => {
            clear()
            setGrid(gridSupplier())
            setWeights(weightSupplier())
            setAlgorithm(undefined)
            setGen(parseInt(e.target.value))
          }}>
            {GenIntValues.map((val, i) => <option value={val} key={i} className={`p-2 h-10 hover:scale-110 rounded-md bg-black text-white`}>{GenValues[parseInt(val)]}</option>)}
          </select>
          <div className='bg-black flex items-center space-x-2 rounded-md'>
            <input type='checkbox' defaultChecked onChange={(e) => {
              if (e.target.checked) setWeightSupplier(() => weightedSupplier)
              else setWeightSupplier(() => unweightedSupplier)
            }} className='w-10 h-10' /><span>Weighted?</span>
          </div>
          <div className='bg-black flex justify-between items-center space-x-2 rounded-mb w-56 h-10 px-2'>
            <div className='flex space-x-1'>
              <span>Size</span>
              <span>{size}</span>
            </div>
            <input type="range" min="1" max="10" value={size} onChange={(e) => setSize(parseInt(e.target.value))}></input>
          </div>
          <div className='flex flex-col space-y-2 bg-black p-2 rounded-md'>
            <span>Animation Speed</span>
            <select className='bg-black' onChange={(e) => setAnimSpeed(parseInt(e.target.value))}>
              <option value="0">Fast</option>
              <option value="10">Mid</option>
              <option value="100">Slow</option>
              <option value="1000">Snail</option>
            </select>
          </div>

          {algorithm && (isAlgoRunning ?
            <button
              className={`w-40 h-10 hover:scale-110 rounded-md bg-red-500 text-white`}
              onClick={() => {
                stopFlag = true
              }}
            >Stop</button>
            : <button
              className={`w-40 h-10 hover:scale-110 rounded-md bg-red-500 text-white`}
              onClick={() => {
                clear()
              }}
            >Clear</button>)}

        </div>
      </header>
      <div className='text-black text-xs absolute bottom-1 left-2'>inspired by <a href="https://clementmihailescu.github.io/Pathfinding-Visualizer/">https://clementmihailescu.github.io/Pathfinding-Visualizer/</a></div>
    </div>
  );
}

export default App;
