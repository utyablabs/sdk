export type Token = {
    symbol: string;
    name: string;
    decimals: number;
    address: string;
};

export type Pool = {
    id: string;
    address: string;
    token0: Token;
    token1: Token;
};