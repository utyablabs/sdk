export function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
    if (amountIn <= 0n) throw new Error('UtyabSwap: Invalid amountIn');
    if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('UtyabSwap: Insufficient reserves');

    const amountInWithFee = amountIn * 997n;
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * 1000n + amountInWithFee;
    return numerator / denominator;
}

export function getAmountIn(amountOut: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
    if (amountOut <= 0n) throw new Error('UtyabSwap: Invalid amountOut');
    if (reserveIn <= 0n || reserveOut <= 0n || amountOut >= reserveOut) throw new Error('UtyabSwap: Insufficient reserves');

    const numerator = reserveIn * amountOut * 1000n;
    const denominator = (reserveOut - amountOut) * 997n;
    return (numerator / denominator) + 1n;
}