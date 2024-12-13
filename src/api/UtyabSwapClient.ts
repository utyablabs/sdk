import type { AxiosInstance } from 'axios';
import axios from 'axios';
import type { Pool, Trade } from './types';
import type { Address } from '@ton/core';

export const MAINNET_API_URL = 'https://api.utyabswap.com/api/';
const DEFAULT_TIMEOUT = 30_000;

export class UtyabSwapClient {
    private axiosClient: AxiosInstance;

    constructor({ endpoint = MAINNET_API_URL, timeout }: { endpoint: string; timeout?: number }) {
        this.axiosClient = axios.create({
            baseURL: endpoint,
            timeout: timeout || DEFAULT_TIMEOUT,
        });
    }

    async getPools(): Promise<Pool[]> {
        const { data } = await this.axiosClient.get('/v1/pools');
        return data;
    }

    async getPoolTrades(poolAddress: Address, startTime?: number, endTime?: number): Promise<Trade[]> {
        const { data } = await this.axiosClient.get('/v1/trades', {
            params: {
                poolAddress: poolAddress.toString(),
                ...(startTime && { start_time: startTime }),
                ...(endTime && { end_time: endTime }),
            },
        });
        return data;
    }
}
