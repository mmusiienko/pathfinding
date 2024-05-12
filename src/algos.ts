import Heap from "heap-js"
import { CellValue, Grid } from "./types"

const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

const getLine = (i: number, j: number, length: number, grid: Grid, isVertical: boolean): [number, number][] => {

    const res: [number, number][] = []
    for (let k = 0; k < length; ++k) {
        if (isVertical && grid[i - k][j] === CellValue.WATER) return []
        if (!isVertical && grid[i][j + k] === CellValue.WATER) return []
        if (isVertical) res.push([i - k, j])
        else res.push([i, j + k])
    }

    return res
}

const getNeighbors = (i: number, j: number, nRows: number, nCols: number): [number, number][] => {
    return ([[i + 1, j], [i, j - 1], [i - 1, j], [i, j + 1]] as [number, number][]).filter(idx => idx[0] >= 0 && idx[0] < nRows && idx[1] >= 0 && idx[1] < nCols)
}

const getLineWeight = (line: [number, number][], weights: number[][]) => line.reduce((acc, [i, j]) => weights[i][j] + acc, 0)

const getFrontier = (i: number, j: number, grid: Grid, size: number, weights?: number[][]): [number, number, number][] => {
    const frontier: [number, number, number][] = []

    if (i + 1 < grid.length) {
        const bottomLine = getLine(i + 1, j, size, grid, false)
        if (bottomLine.length !== 0) {
            let bottomW = 0
            if (weights) bottomW = getLineWeight(bottomLine, weights)
            console.log(bottomW)
            frontier.push([bottomW, i + 1, j])
        }
    }

    if (j > 0) {
        const leftLine = getLine(i, j - 1, size, grid, true)
        if (leftLine.length !== 0) {
            let leftW = 0
            if (weights) leftW = getLineWeight(leftLine, weights)
            frontier.push([leftW, i, j - 1])
        }
    }

    if (i - size >= 0) {
        const topLine = getLine(i - size, j, size, grid, false)
        if (topLine.length !== 0) {
            let topW = 0
            if (weights) topW = getLineWeight(topLine, weights)
            frontier.push([topW, i - 1, j])
        }
    }

    if (j + size < grid[i].length) {
        const rightLine = getLine(i, j + size, size, grid, true)
        if (rightLine.length !== 0) {
            let rightW = 0
            if (weights) rightW = getLineWeight(rightLine, weights)
            frontier.push([rightW, i, j + 1])
        }
    }
    return frontier
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
    shouldAnimate: boolean,
    animSpeed: number,
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
            if (shouldAnimate) await sleep(animSpeed)
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
    shouldAnimate: boolean,
    animSpeed: number,
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
            if (shouldAnimate) await sleep(animSpeed)
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
                if (type === CellValue.TARGET || type === CellValue.SOURCE) {
                    if (((i + 1 >= grid.length || grid[i + 1][j] !== type) && (j - 1 < 0 || grid[i][j - 1] !== type)) && grid[i][j] === type) {
                        console.log("XD")
                        return [i, j]
                    }
                } else {
                    return [i, j]
                }
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
    size: number,
    shouldAnimate: boolean,
    animSpeed: number,
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
            await fallBack(i, j, visited, grid, path, setPath, shouldAnimate, animSpeed)
            return true
        }

        if (shouldAnimate) {
            if (shouldAnimate) setCurrentNode([i, j])
            if (shouldAnimate) setVisited([...visited])
            await sleep(animSpeed)
        }
        for (const [w, ni, nj] of getFrontier(i, j, grid, size)) {
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
    size: number,
    shouldAnimate: boolean,
    animSpeed: number,
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
                console.log(visited)
                setPath([...path])
                setCurrentNode([i, j])
                setVisited([...visited])
                await fallBack(i, j, visited, grid, path, setPath, shouldAnimate, animSpeed)
                return true
            }

            if (shouldAnimate) {
                setVisited([...visited])
                setCurrentNode([i, j])
                await sleep(animSpeed)
            }


            getFrontier(i, j, grid, size).forEach(([w, ni, nj]) => q.push([ni, nj]))
        }
        return false
    }

    if (!await found()) {
        setVisited([...visited])
        setCurrentNode([-1, -1])
        setPath(pathSupplier(grid.length, grid[0].length))
    }
}

const manhattan = (i1: number, j1: number, i2: number, j2: number) => Math.abs(i1 - i2) + Math.abs(j1 - j2)

export const astar = async (
    grid: Grid,
    setCurrentNode: (node: [number, number]) => void,
    setVisited: React.Dispatch<React.SetStateAction<number[][]>>,
    setPath: React.Dispatch<React.SetStateAction<boolean[][]>>,
    weightsParam: number[][],
    size: number,
    shouldAnimate: boolean,
    animSpeed: number,
    heuristic: (i1: number, j1: number, i2: number, j2: number) => number = manhattan,
) => {
    const visited = visitedSupplier(grid.length, grid[0].length)
    const path = pathSupplier(grid.length, grid[0].length)

    const found = async () => {
        const heap = new Heap<[number, number, number]>((e1, e2) => e1[0] + (size + 1) * heuristic(e1[1], e1[2], ti, tj) - e2[0] - (size + 1) * heuristic(e2[1], e2[2], ti, tj)) // in heap [weight, i, j], when comparing weight + heuristic is used
        const [si, sj] = findNode(CellValue.SOURCE, grid)
        const [ti, tj] = findNode(CellValue.TARGET, grid)
        if (si === -1) return false
        if (tj === -1) return false
        let order = 0
        const weights = weightsParam.map(arr => [...arr])
        heap.push([weights[si][sj], si, sj])

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
                await fallBackWeighted(i, j, visited, grid, path, setPath, weights, shouldAnimate, animSpeed)
                return true
            }

            if (shouldAnimate) {
                setVisited([...visited])
                setCurrentNode([i, j])
                await sleep(animSpeed)
            }
            getFrontier(i, j, grid, size, weightsParam).forEach(([w, ni, nj]) => {
                heap.push([grid[ni][nj] !== CellValue.TARGET ? weight + w : 0, ni, nj])
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
    size: number,
    shouldAnimate: boolean,
    animSpeed: number,
) => {
    await astar(
        grid,
        setCurrentNode,
        setVisited,
        setPath,
        weightsParam,
        size,
        shouldAnimate,
        animSpeed,
        () => 0,
    )
}