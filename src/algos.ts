import Heap from "heap-js"
import { ANIM_SPEED } from "./App"
import { CellValue, Grid } from "./types"

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))


const getNeighbors = (i: number, j: number, nRows: number, nCols: number): [number, number][] => {
    return ([[i + 1, j], [i - 1, j], [i, j - 1], [i, j + 1]] as [number, number][]).filter(idx => idx[0] >= 0 && idx[0] < nRows && idx[1] >= 0 && idx[1] < nCols)
}

const visitedSupplier = (nRows: number, nCols: number) => Array.from({ length: nRows }, () => Array(nCols).fill(-1))
const pathSupplier = (nRows: number, nCols: number) => Array.from({ length: nRows }, () => Array(nCols).fill(false))

const fallBack = async (
    i: number,
    j: number,
    visited: number[][],
    grid: Grid, 
    path: boolean[][], 
    setPath: (path: boolean[][]) => void,
    shouldAnimate: boolean
) => {
    const helper = async (i: number, j: number) => {
        const next = getNeighbors(i, j, grid.length, grid[i].length).filter(([ni, nj]) => visited[ni][nj] >= 0 && visited[ni][nj] < visited[i][j])
        const values = next.map(idx => visited[idx[0]][idx[1]])
        let max = Number.NEGATIVE_INFINITY
        let maxIdx = -1
        for (let i = 0; i < values.length; ++i) {
            if (values[i] > max) {
                max = values[i]
                maxIdx = i
            }
        }
    
        if (maxIdx !== -1) {
            path[next[maxIdx][0]][next[maxIdx][1]] = true
            if (shouldAnimate) setPath([...path])
            if (shouldAnimate) await sleep(ANIM_SPEED)
            await helper(next[maxIdx][0], next[maxIdx][1])
        }
    }
    await helper(i, j)
    setPath([...path])
}

const fallBackWeighted = async (
    i: number,
    j: number,
    visited: number[][],
    grid: Grid, 
    path: boolean[][], 
    setPath: (path: boolean[][]) => void,
    weight: number[][],
    shouldAnimate: boolean
) => {
    const helper = async (i: number, j: number) => {
        const next = getNeighbors(i, j, grid.length, grid[i].length).filter(([ni, nj]) => visited[ni][nj] >= 0 && visited[ni][nj] < visited[i][j])
        const values = next.map(idx => weight[idx[0]][idx[1]])
        let min = Number.POSITIVE_INFINITY
        let minIdx = -1
        for (let i = 0; i < values.length; ++i) {
            if (values[i] < min) {
                min = values[i]
                minIdx = i
            }
        }
    
        if (minIdx !== -1) {
            path[next[minIdx][0]][next[minIdx][1]] = true
            if (shouldAnimate) setPath([...path])
            if (shouldAnimate) await sleep(ANIM_SPEED)
            await helper(next[minIdx][0], next[minIdx][1])
        }
    }
    await helper(i, j)
    if (!shouldAnimate) setPath([...path])
}

const findNode = (type: CellValue, grid: Grid): [number, number] => {
    for (let i = 0; i < grid.length; ++i) {
        for (let j = 0; j < grid[i].length; ++j) {
            if (grid[i][j] === type) {
                return [i, j]
            }
        }
    }
    return [-1, -1]
}

export const dfs = async (
    grid: Grid,
    setCurrentNode: (node: [number, number]) => void,
    setVisited: (visited: number[][]) => void,
    setPath: (path: boolean[][]) => void,
    shouldAnimate: boolean
) => {
    let order = 0
    const [i, j] = findNode(CellValue.SOURCE, grid)
    const visited = visitedSupplier(grid.length, grid[0].length)
    const path = pathSupplier(grid.length, grid[0].length)

    const found = async (i: number, j: number) => {
        if (i < 0 || i >= grid.length || j < 0 || j >= grid[i].length) return false
        if (grid[i][j] === CellValue.WATER) return false
        if (visited[i][j] !== -1) return false

        visited[i][j] = order
        order += 1

        if (grid[i][j] === CellValue.TARGET) {
            path[i][j] = true
            setCurrentNode([i, j])
            setVisited([...visited])
            setPath([...path])
            await fallBack(i, j, visited, grid, path, setPath, shouldAnimate)
            return true
        }

        if (shouldAnimate) {
            if (shouldAnimate) setCurrentNode([i, j])
            if (shouldAnimate) setVisited([...visited])
            await sleep(ANIM_SPEED)
        }

        for (const [ni, nj] of getNeighbors(i, j, grid.length, grid[i].length)) {
            if (await found(ni, nj)) return true
        }
    }
    if (i !== -1 && j !== -1) {
        if (!await found(i, j)) {
            setVisited([...visited])
            setCurrentNode([-1, -1])
            setPath(pathSupplier(grid.length, grid[0].length))
        }
    }
}

export const bfs = async (
    grid: Grid,
    setCurrentNode: (node: [number, number]) => void,
    setVisited: (visited: number[][]) => void,
    setPath: (path: boolean[][]) => void,
    shouldAnimate: boolean,
) => {
    const visited = visitedSupplier(grid.length, grid[0].length)
    const path = pathSupplier(grid.length, grid[0].length)

    const found = async () => {
        let order = 0
        const q: [number, number][] = []
        const [i, j] = findNode(CellValue.SOURCE, grid)
        if (i === -1) return false
        q.push([i, j])
        while (q.length !== 0) {
            const [i, j] = q.shift()!
            if (grid[i][j] === CellValue.WATER) continue
            if (visited[i][j] !== -1) continue
    
            visited[i][j] = order
            order += 1
            
            if (grid[i][j] === CellValue.TARGET) {
                path[i][j] = true
                setPath([...path])
                setCurrentNode([i, j])
                setVisited([...visited])
                await fallBack(i, j, visited, grid, path, setPath, shouldAnimate)
                return true
            }
    
            if (shouldAnimate) {
                setVisited([...visited])
                setCurrentNode([i, j])
                await sleep(ANIM_SPEED)
            }
    
    
            getNeighbors(i, j, grid.length, grid[i].length).forEach(([ni, nj]) => q.push([ni, nj]))
        }
        return false
    }

    if (!await found()) {
        setVisited([...visited])
        setCurrentNode([-1, -1])
        setPath(pathSupplier(grid.length, grid[0].length))
    }
}

const manhattan = (i1: number, j1:number, i2: number, j2: number) => Math.abs(i1 - i2) + Math.abs(j1 - j2)

export const astar = async (
    grid: Grid,
    setCurrentNode: (node: [number, number]) => void,
    setVisited: React.Dispatch<React.SetStateAction<number[][]>>,
    setPath: React.Dispatch<React.SetStateAction<boolean[][]>>,
    weightsParam: number[][],
    shouldAnimate: boolean,
    heuristic: (i1: number, j1: number, i2: number, j2: number) => number = manhattan
) => {
    const visited = visitedSupplier(grid.length, grid[0].length)
    const path = pathSupplier(grid.length, grid[0].length)
    
    const found = async () => {
        const heap = new Heap<[number, number, number]>((e1, e2) => e1[0] + 2*heuristic(e1[1], e1[2], ti, tj) - e2[0] - 2*heuristic(e2[1], e2[2], ti, tj)) // in heap [weight, i, j], when comparing weight + heuristic is used
        const [si, sj] = findNode(CellValue.SOURCE, grid)
        const [ti, tj] = findNode(CellValue.TARGET, grid)
        if (si === -1) return false
        if (tj === -1) return false
        let order = 0
        const weights = weightsParam.map(arr => [...arr])
        heap.push([0, si, sj])
    
        while (heap.length !== 0) {
            const [weight, i, j] = heap.pop()!
    
            if (grid[i][j] === CellValue.WATER) continue
            if (visited[i][j] !== -1) continue
    
            weights[i][j] = weight
            visited[i][j] = order
            order += 1
            if (grid[i][j] === CellValue.TARGET) {
                path[i][j] = true
                setVisited([...visited])
                setCurrentNode([i, j])
                setPath([...path])
                await fallBackWeighted(i, j, visited, grid, path, setPath, weights, shouldAnimate)
                return true
            }
    
            if (shouldAnimate) {
                setVisited([...visited])
                setCurrentNode([i, j])
                await sleep(ANIM_SPEED)
            } 
    
            getNeighbors(i, j, grid.length, grid[i].length).forEach(([ni, nj]) => {
                heap.push([grid[ni][nj] !== CellValue.TARGET ? weight + weightsParam[ni][nj] : 0, ni, nj])
            })
        }
        return false
    }

    if (!(await found())) {
        setVisited([...visited])
        setCurrentNode([-1, -1])
        setPath(pathSupplier(grid.length, grid[0].length))
    }
}

export const djikstra = async (
    grid: Grid,
    setCurrentNode: (node: [number, number]) => void,
    setVisited: React.Dispatch<React.SetStateAction<number[][]>>,
    setPath: React.Dispatch<React.SetStateAction<boolean[][]>>,
    weightsParam: number[][],
    shouldAnimate: boolean
) => {
    await astar(
        grid,
        setCurrentNode,
        setVisited,
        setPath,
        weightsParam,
        shouldAnimate,
        () => 0,
    )
}