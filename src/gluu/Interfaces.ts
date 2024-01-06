/**
 * Represents information about a uniform within a UBO.
 */
export interface UniformInfo {
    [key: string]: {
        offset: number;
    };
}