import { useEffect, useState } from 'react';
import './App.css';
import { CellValue, Gen, Grid } from './types';
import { astar, bfs, dfs, djikstra } from './algos';
import { generate } from './gen';

const W = 80
const H = 50

export const N_BRIDGES = 3
export const N_RIVERS = 4

export const R_WIDTH = 2

const CellValues = Object.keys(CellValue).slice(Object.keys(CellValue).length / 2)
const GenValues = Object.keys(Gen).slice(Object.keys(Gen).length / 2)
const GenIntValues = Object.keys(Gen).slice(0, Object.keys(Gen).length / 2)

const valToColor = ["bg-green-700", "bg-blue-500", "bg-pink-500", "bg-pink-400", "bg-yellow-950"]

const valToColorHex = ["#15803d", "#3b82f6", "#ec4899", "#f472b6", "#422006"]

const visitedSupplier = () => Array.from({ length: H }, () => Array(W).fill(-1))
const pathSupplier = () => Array.from({ length: H }, () => Array(W).fill(false))
const unweightedSupplier = () => Array.from({ length: H }, () => Array(W).fill(0).map(i => 1))
const weightedSupplier = () => Array.from({ length: H }, () => Array(W).fill(0).map(i => Math.floor(Math.random() * 3) + 1))
const gridSupplier = () => Array.from({ length: H }, () => Array(W).fill(CellValue.GRASS))
const currentNodeSupplier = (): [number, number] => [-1, -1]

const App = () => {
  const [grid, setGrid] = useState<Grid>(gridSupplier())
  const [size, setSize] = useState<number>(1)
  const [weightSupplier, setWeightSupplier] = useState<() => number[][]>(() => unweightedSupplier)
  const [weights, setWeights] = useState<number[][]>(weightSupplier())
  const [visited, setVisited] = useState<number[][]>(visitedSupplier())
  const [path, setPath] = useState<boolean[][]>(pathSupplier())
  const [currentNode, setCurrentNode] = useState<[number, number]>(currentNodeSupplier())
  const [drawingColor, setDrawingColor] = useState<CellValue>(CellValue.SOURCE)
  const [secDrawingColor, setSecDrawingColor] = useState<CellValue>(CellValue.TARGET)
  const [isDrawing, setDrawing] = useState<boolean>(false)
  const [isRmb, setRmb] = useState<boolean>(false)
  const [gen, setGen] = useState<Gen>(Gen.FLAT)
  const [algorithm, setAlgorithm] = useState<(shouldAnimate: boolean) => void>()
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(true)
  const [animSpeed, setAnimSpeed] = useState<number>(0)

  const clear = () => {
    setVisited(visitedSupplier())
    setPath(pathSupplier())
    setCurrentNode(currentNodeSupplier())
    setShouldAnimate(true)
  }

  const getCellColor = (i: number, j: number) => {
    if (currentNode[0] === i && currentNode[1] === j) {
      return "bg-yellow-200"
    }

    if (path[i][j]) {
      return "bg-orange-500"
    }

    if (visited[i][j] !== -1) {
      return "bg-indigo-800"
    }

    if (grid[i][j] === CellValue.GRASS) {
      if (weights[i][j] === 2) return "bg-green-800 bg-opacity-95"
      if (weights[i][j] === 3) return "bg-green-900 bg-opacity-95"
    }

    return valToColor[grid[i][j]]
  }

  useEffect(() => {

  }, [size])

  useEffect(() => {
    if (algorithm) {
      algorithm(shouldAnimate)
      setShouldAnimate(false)
    }
  }, [algorithm, grid])

  useEffect(() => setWeights(weightSupplier()), [weightSupplier])

  useEffect(
    () => {
      setGrid(gridSupplier())
      setVisited(visitedSupplier())
      setPath(pathSupplier())
      setCurrentNode(currentNodeSupplier())
      generate(gen, setGrid, size)

      const startDrawing = (e: MouseEvent) => {
        setDrawing(true)
        setRmb(e.button === 2)
      }
      const endDrawing = (e: MouseEvent) => setDrawing(false)

      document.addEventListener("mousedown", startDrawing)
      document.addEventListener("mouseup", endDrawing)

      return () => {
        document.removeEventListener("mousedown", startDrawing)
        document.removeEventListener("mouseup", endDrawing)
      }
    }
    , [gen])

  const fillCellAndReplaceExisting = (cellToFill: CellValue, i: number, j: number) => {
    if (grid[i][j] === CellValue.WATER) return
    
    for (let di = 0; di < size; ++di) {
      for (let dj = 0; dj < size; ++dj) {
        if (i - di < 0 || j + dj < 0 || i - di >= grid.length || j + dj >= grid[0].length) return
      }
    }

    grid.forEach((row, i) => row.forEach((cell, j) => {
      if (cellToFill === cell) {
        grid[i][j] = CellValue.GRASS
      }
    }))

    for (let di = 0; di < size; ++di) {
      for (let dj = 0; dj < size; ++dj) {
        grid[i - di][j + dj] = cellToFill
      }
    }

    setGrid([...grid])
  }

  const fillCell = (cellToFill: CellValue, i: number, j: number) => {
    grid[i][j] = cellToFill
    setGrid([...grid])
  }

  return (
    <div className="App w-full h-full flex items-center justify-center p-1">
      <header className="App-header flex space-x-2">
        <div className='flex flex-col'>
          {grid.map((row, i) =>
            <div key={`row${i}`} className='flex'>
              {
                row.map((cell, j) =>
                  <button key={`row${i}cell${j}`}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      if (secDrawingColor === CellValue.SOURCE || secDrawingColor === CellValue.TARGET) {
                        fillCellAndReplaceExisting(secDrawingColor, i, j)
                        return
                      }
                      fillCell(secDrawingColor, i, j)
                    }}
                    onMouseMove={(e) => {
                      e.preventDefault()
                      if (!isDrawing)
                        return

                      if (isRmb) {
                        if (secDrawingColor === CellValue.SOURCE || secDrawingColor === CellValue.TARGET) {
                          fillCellAndReplaceExisting(secDrawingColor, i, j)
                          return
                        }
                        fillCell(secDrawingColor, i, j)
                      } else {
                        if (drawingColor === CellValue.SOURCE || drawingColor === CellValue.TARGET) {
                          fillCellAndReplaceExisting(drawingColor, i, j)
                          return
                        }

                        fillCell(drawingColor, i, j)
                      }
                    }}

                    onClick={(e) => {
                      if (drawingColor === CellValue.SOURCE || drawingColor === CellValue.TARGET) {
                        fillCellAndReplaceExisting(drawingColor, i, j)
                        return
                      }
                      fillCell(drawingColor, i, j)
                    }} className={getCellColor(i, j) + ' bg-opacity-[96%] flex justify-center items-center p-[2px]'}>
                    <div
                      className={`cell w-4 h-4 hover:scale-125 text-black text-xs ` + getCellColor(i, j)}>
                    </div>
                  </button>
                )}
            </div>
          )}
        </div>
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
            onClick={() => setAlgorithm(() => async (shouldAnimate: boolean) => {
              setShouldAnimate(true)
              await dfs(
                grid,
                setCurrentNode,
                setVisited,
                setPath,
                size,
                shouldAnimate,
                animSpeed
              )
            })}
          >DFS</button>
          <button
            className={`w-40 h-10 hover:scale-110 rounded-md bg-black text-white`}
            onClick={() => setAlgorithm(() => async (shouldAnimate: boolean) => {
              setShouldAnimate(true)
              await bfs(
                grid,
                setCurrentNode,
                setVisited,
                setPath,
                size,
                shouldAnimate,
                animSpeed
              )
            })}
          >BFS</button>
          <button
            className={`w-40 h-10 hover:scale-110 rounded-md bg-black text-white`}
            onClick={() => setAlgorithm(() => async (shouldAnimate: boolean) => {
              setShouldAnimate(true)
              await djikstra(
                grid,
                setCurrentNode,
                setVisited,
                setPath,
                weights,
                size,
                shouldAnimate,
                animSpeed
              )
            })}
          >Dijkstra</button>
          <button
            className={`w-40 h-10 hover:scale-110 rounded-md bg-black text-white`}
            onClick={() => setAlgorithm(() => async (shouldAnimate: boolean) => {
              setShouldAnimate(true)
              await astar(
                grid,
                setCurrentNode,
                setVisited,
                setPath,
                weights,
                size,
                shouldAnimate,
                animSpeed
              )
            })}
          >A*</button>
          <button
            className={`w-40 h-10 hover:scale-110 rounded-md bg-black text-white`}
            onClick={clear}
          >Clear</button>
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
          <select className='bg-black w-40 h-10 rounded-md p-2' onChange={(e) => {
            clear()
            setGrid(gridSupplier())
            setWeights(weightSupplier())
            setAlgorithm(undefined)
            setGen(parseInt(e.target.value))
          }}>
            {GenIntValues.map((val, i) => <option value={val} key={i} className={`p-2 h-10 hover:scale-110 rounded-md bg-black text-white`}>{GenValues[parseInt(val)]}</option>)}
          </select>
          <div className='bg-black flex items-center space-x-2 rounded-md'>
            <input type='checkbox' onChange={(e) => {
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
        </div>
      </header>
    </div>
  );
}

export default App;
