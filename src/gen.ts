import { N_BRIDGES, N_RIVERS, R_WIDTH } from "./App"
import { CellValue, Gen, Grid } from "./types"

const clamp = (num: number, min: number, max: number): number => Math.min(Math.max(num, min), max)

export const fillRiver = (setGrid: React.Dispatch<React.SetStateAction<Grid>>) => {
    setGrid(grid => {
        for (let k = 0; k < N_RIVERS; ++k) {
            const isVertical = (Math.floor(Math.random() * 2) === 0)
            let posToStartRiver = (isVertical ? Math.floor(Math.random() * (grid[0].length)) : Math.floor(Math.random() * (grid.length)))
            const to = (isVertical ? grid.length : grid[0].length)
            for (let i = 0; i < to; ++i) {
                const start = clamp(posToStartRiver - Math.floor(Math.random() * 2 + R_WIDTH / 2), 0, (isVertical ? grid[i].length - 1 : grid.length - 1))
                const end = clamp(posToStartRiver + Math.floor(Math.random() * 2 + R_WIDTH / 2), 0, (isVertical ? grid[i].length - 1 : grid.length - 1))
                const isBridge = (Math.floor(Math.random() * (to / N_BRIDGES) * N_RIVERS) === 0)
                posToStartRiver = clamp(posToStartRiver + Math.floor(Math.random() * 3) - 1, 0, (isVertical ? grid[i].length - 1 : grid.length - 1))

                for (let j = 0; j < (isVertical ? grid[i].length : grid.length); ++j) {
                    if (j >= start && j <= end) {
                        if ((isVertical ? grid[i][j] : grid[j][i]) !== CellValue.GRASS) continue

                        if (isVertical) {
                            grid[i][j] = isBridge ? CellValue.BRIDGE : CellValue.WATER
                        } else {
                            grid[j][i] = isBridge ? CellValue.BRIDGE : CellValue.WATER
                        }
                    }
                }
            }
        }
        return [...grid]
    })
}

const isOrientationVertical = (w: number, h: number) => {
    if (w < h) return true
    if (h < w) return false
    return Math.floor(Math.random() * 2) === 0
}

export const recursiveDiv = (setGrid: React.Dispatch<React.SetStateAction<Grid>>, size: number) => {
    setGrid(grid => {
        const doors = Array.from({ length: grid.length }, () => Array(grid[0].length).fill(false))

        const divide = (i1: number, j1: number, i2: number, j2: number) => {
            if (i2 - i1 < 2 * size || j2 - j1 < 2 * size) return
            let j = j1 + Math.floor(Math.random() * ((j2 - j1 - size) / 2)) + size

            let i = i1 + Math.floor(Math.random() * ((i2 - i1 - size) / 2)) + size

            const isVertical = isOrientationVertical(i2 - i1, j2 - j1)
            if (isVertical) {
                for (let k = i1; k <= i2; ++k) {

                    let isDoorNear = false
                    for (let d = 1; d <= size; ++d) {
                        if (k - d >= 0 && doors[k - d][j]) {
                            isDoorNear = true
                            break
                        }
                    }

                    if (isDoorNear) continue

                    for (let d = 1; d <= size; ++d) {
                        if (k + d < grid.length && doors[k + d][j]) {
                            isDoorNear = true
                            break
                        }
                    }

                    if (isDoorNear) continue
                    
                    grid[k][j] = CellValue.WATER
                }

                for (let d = i; d < i + size; ++d) {
                    if (d < grid.length) {
                        doors[d][j] = true
                        grid[d][j] = CellValue.GRASS
                    }
                }

                divide(i1, j1, i2, j - 1)
                divide(i1, j + 1, i2, j2)
            } else {
                for (let k = j1; k <= j2; ++k) {

                    let isDoorNear = false
                    for (let d = 1; d <= size; ++d) {
                        if (k - d >= 0 && doors[i][k - d]) {
                            isDoorNear = true
                            break
                        }
                    }

                    if (isDoorNear) continue

                    for (let d = 1; d <= size; ++d) {
                        if (k + d < grid[i].length && doors[i][k + d]) {
                            isDoorNear = true
                            break
                        }
                    }

                    if (isDoorNear) continue

                    grid[i][k] = CellValue.WATER
                }

                for (let d = j; d < j + size; ++d) {
                    if (d < grid[0].length) {
                        doors[i][d] = true
                        grid[i][d] = CellValue.GRASS
                    }
                }

                divide(i1, j1, i - 1, j2)
                divide(i + 1, j1, i2, j2)
            }

        }
        divide(0, 0, grid.length - 1, grid[0].length - 1)
        return [...grid]
    })
}

export const flat = (setGrid: React.Dispatch<React.SetStateAction<Grid>>) => {
    setGrid(grid => {
        grid.forEach((row, i) => row.forEach((cell, j) => grid[i][j] = CellValue.GRASS))
        return [...grid]
    })
}

const genToFunc: Record<Gen, (setGrid: React.Dispatch<React.SetStateAction<Grid>>, size: number) => void> = {
    [Gen.FLAT]: flat,
    [Gen.RIVERS]: fillRiver,
    [Gen.RECURSIVEDIV]: recursiveDiv
};

export const generate = (gen: Gen, setGrid: React.Dispatch<React.SetStateAction<Grid>>, size: number) => {
    genToFunc[gen](setGrid, size)
}
