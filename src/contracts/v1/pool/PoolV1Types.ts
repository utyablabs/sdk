import { toNano } from "@ton/core";

export const POOL_OP_CODES = {
    NativeSwap: 0xbfa18885,
    NativeDeposit: 0x822d8a0,
    BurnLiquidity: 0x595f07bc,
};

export enum PoolStatus {
    NotReady = 0,
    Ready = 1,
    WalletMissing = 2,
}

export const SWAP_FEES = {
    nativeToToken: toNano('0.1'),
    tokenToNative: toNano('0.1'),
    tokenToToken: toNano('0.14'),
};

export const SWAP_FEES_WITH_REFERRAL = {
    nativeToToken: toNano('0.14'),
    tokenToNative: toNano('0.13'),
    tokenToToken: toNano('0.17'),
};