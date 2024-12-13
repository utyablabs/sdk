export type Trade = {
    hash: string;
    receiver: string;
    pool: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    amountOut: string;
    timestamp: number;
    reserveIn: string;
    reserveOut: string;
};