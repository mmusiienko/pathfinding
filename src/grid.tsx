import { useEffect, useState } from "react"
import { valToColor } from "./App"
import { CellValue, Gen, TGrid } from "./types"
import { generate } from "./gen"

interface IGrid {
    grid: TGrid
    setGrid: React.Dispatch<React.SetStateAction<CellValue[][]>>
    drawingColor: CellValue
    secDrawingColor: CellValue
    targetSize: number
    currentNode: [number, number]
    path: boolean[][]
    visited: number[][]
    weights: number[][]
    clear: () => void
    gen: Gen
}

export const Grid: React.FC<IGrid> = ({ grid, setGrid, targetSize: size, currentNode, path, visited, weights, drawingColor, secDrawingColor, clear, gen }) => {
    const [isRmb, setRmb] = useState<boolean>(false)
    const [isDrawing, setDrawing] = useState<boolean>(false)

    useEffect(
        () => {
            clear()
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

    const getCellColor = (i: number, j: number) => {
        if (currentNode[0] === i && currentNode[1] === j) {
            return "bg-yellow-200"
        }

        if (path[i][j]) {
            return "bg-orange-500 animate-pulse"
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
                                    className={`cell w-5 h-5 hover:scale-125 text-black text-xs hover:transition-none duration-75 transition-colors ` + getCellColor(i, j)}>
                                </div>
                            </button>
                        )}
                </div>
            )}
        </div>
    )
}