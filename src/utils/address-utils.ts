import { Address } from '@ton/core';

export const convertAddressToBigInt = (address: Address): bigint => {
    return BigInt(`0x${address.toRawString().replace('0:', '')}`);
};

const bigIntTo256BitHex = (n: bigint): string => {
    const hex = n.toString(16);
    return hex.padStart(64, '0');
};

export const convertBigIntToAddress = (uint: bigint): Address => {
    const addressString = `0:${bigIntTo256BitHex(uint)}`;
    return Address.parse(addressString);
};
