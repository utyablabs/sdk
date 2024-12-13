import {
    Address,
    beginCell,
    toNano,
    type Contract,
    type ContractProvider,
    type Sender,
} from '@ton/core';
import { FACTORY_OP_CODES } from './FactoryV1Types';
import { Asset } from '../common/Asset';

export class Factory implements Contract {
    static readonly FACTORY_ADDRESS = Address.parse("EQAXxjNhvKAqxDcR0Nz4lyWHcfvwpdOxfC7SP3buCp2WDeTb");
    
    constructor(readonly address: Address) {}

    static createFromAddress(address: Address) {
        return new Factory(address);
    }

    static deployPoolMessage(opts: { asset0: Asset; asset1: Asset }) {
        return beginCell()
            .storeUint(FACTORY_OP_CODES.DeployPool, 32)
            .store(opts.asset0)
            .store(opts.asset1)
            .endCell();
    }

    async sendDeployPool(
        provider: ContractProvider,
        via: Sender,
        opts: { asset0: Asset; asset1: Asset }
    ) {
        await provider.internal(via, {
            value: toNano('0.3'),
            body: Factory.deployPoolMessage(opts),
        });
    }

    async getPoolAddress(
        provider: ContractProvider,
        opts: {
            asset0: Asset;
            asset1: Asset;
        }
    ) {
        const res = await provider.get('get_pool_address', [
            { type: 'int', value: BigInt(opts.asset0.type) },
            { type: 'int', value: opts.asset0.address },
            { type: 'int', value: BigInt(opts.asset1.type) },
            { type: 'int', value: opts.asset1.address },
        ]);

        const owner = res.stack.readAddress();

        return owner;
    }
}
