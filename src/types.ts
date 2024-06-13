export enum CellValue {
    GRASS,
    WATER,
    SOURCE,
    TARGET,
    BRIDGE
}

export enum Gen {
    FLAT,
    RIVERS,
    RECURSIVEDIV
}

export type TGrid = CellValue[][]