import {
    beginCell,
    type Address,
    type Contract,
    toNano,
    type ContractProvider,
    type Sender,
} from '@ton/core';
import { convertBigIntToAddress } from '../../../utils/address-utils';
import { POOL_OP_CODES, PoolStatus, SWAP_FEES, SWAP_FEES_WITH_REFERRAL } from './PoolV1Types';
import { Asset } from '../common/Asset';

export class PoolV1 implements Contract {
    constructor(readonly address: Address) {}

    static createFromAddress(address: Address): PoolV1 {
        return new PoolV1(address);
    }

    static nativeSwapMessage(opts: {
        sender: Address;
        amount: bigint;
        minOut: bigint;
        referral: Address | null;
    }) {
        const nativeSwapBody = beginCell()
            .storeUint(POOL_OP_CODES.NativeSwap, 32)
            .storeAddress(opts.sender)
            .store(Asset.native())
            .storeCoins(opts.amount)
            .storeCoins(opts.minOut)
            .storeBit(Boolean(opts.referral));

        if (opts.referral) {
            nativeSwapBody.storeAddress(opts.referral);
        }

        return nativeSwapBody.endCell();
    }

    async sendNativeSwap(
        provider: ContractProvider,
        via: Sender,
        opts: {
            sender: Address;
            amount: bigint;
            minOut: bigint;
            referral: Address | null;
        }
    ) {
        const nativeTransferBody = PoolV1.nativeSwapMessage(opts);

        await provider.internal(via, {
            bounce: false,
            value: opts.referral
                ? SWAP_FEES_WITH_REFERRAL.nativeToToken + opts.amount
                : SWAP_FEES.nativeToToken + opts.amount,
            body: nativeTransferBody,
        });
    }

    static tokenSwapMessage(
        sender: Address,
        poolAddress: Address,
        opts: {
            assetIn: Asset;
            assetOut: Asset;
            jetton_amount: bigint;
            minOut: bigint;
            referral: Address | null;
        }
    ) {
        const forwardPayload = beginCell()
            .storeUint(2, 8)
            .storeCoins(opts.minOut)
            .storeAddress(sender)
            .store(opts.assetIn)
            .storeBit(opts.referral != null ? true : false);

        if (opts.referral != null) {
            forwardPayload.storeAddress(opts.referral);
        }

        const transferBody = beginCell()
            .storeUint(0xf8a7ea5, 32)
            .storeUint(0, 64) // op, queryId
            .storeCoins(opts.jetton_amount)
            .storeAddress(poolAddress)
            .storeAddress(null)
            .storeMaybeRef(null)
            .storeCoins(
                opts.referral != null
                    ? opts.assetOut.type == 0
                        ? toNano('0.08')
                        : toNano('0.14')
                    : opts.assetOut.type == 0
                      ? toNano('0.065')
                      : toNano('0.1')
            )
            .storeMaybeRef(forwardPayload.endCell())
            .endCell();

        return transferBody;
    }

    async sendTokenSwap(
        provider: ContractProvider,
        via: Sender,
        opts: {
            sender: Address;
            walletAddress: Address;
            assetIn: Asset;
            assetOut: Asset;
            jetton_amount: bigint;
            minOut: bigint;
            referral: Address | null;
        }
    ) {
        const transferBody = PoolV1.tokenSwapMessage(opts.sender, this.address, opts);

        await via.send({
            to: opts.walletAddress,
            value:
                opts.referral != null
                    ? opts.assetOut.type == 0
                        ? SWAP_FEES_WITH_REFERRAL.tokenToNative
                        : SWAP_FEES_WITH_REFERRAL.tokenToToken
                    : opts.assetOut.type == 0
                      ? SWAP_FEES.tokenToNative
                      : SWAP_FEES.tokenToToken,
            body: transferBody,
        });
    }

    static nativeDepositMessage(opts: { amount: bigint; minLpOut: bigint }) {
        return beginCell()
            .storeUint(POOL_OP_CODES.NativeDeposit, 32)
            .storeCoins(opts.amount)
            .store(Asset.native())
            .storeCoins(opts.minLpOut)
            .endCell();
    }

    async sendNativeDeposit(
        provider: ContractProvider,
        via: Sender,
        opts: {
            amount: bigint;
            minLpOut: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.amount + toNano('0.5'),
            body: PoolV1.nativeDepositMessage(opts),
        });
    }

    static tokenDepositMessage(
        sender: Address,
        poolAddress: Address,
        opts: {
            asset: Asset;
            jetton_amount: bigint;
            minLpOut: bigint;
        }
    ) {
        const forwardPayload = beginCell()
            .storeUint(1, 8)
            .store(opts.asset)
            .storeCoins(opts.minLpOut)
            .endCell();

        const transferBody = beginCell()
            .storeUint(0xf8a7ea5, 32)
            .storeUint(0, 64)
            .storeCoins(opts.jetton_amount)
            .storeAddress(poolAddress)
            .storeAddress(sender)
            .storeMaybeRef(null)
            .storeCoins(toNano('0.05'))
            .storeMaybeRef(forwardPayload)
            .endCell();

        return transferBody;
    }

    async sendTokenDeposit(
        provider: ContractProvider,
        via: Sender,
        opts: {
            sender: Address;
            walletAddress: Address;
            asset: Asset;
            jetton_amount: bigint;
            minLpOut: bigint;
        }
    ) {
        await via.send({
            to: opts.walletAddress,
            value: toNano('0.8'),
            body: PoolV1.tokenDepositMessage(opts.sender, this.address, opts),
        });
    }

    static removeLiquidityMessage(sender: Address, opts: { amount: bigint }) {
        return beginCell()
            .storeUint(POOL_OP_CODES.BurnLiquidity, 32)
            .storeUint(0, 64)
            .storeCoins(opts.amount)
            .storeAddress(sender)
            .endCell();
    }

    async sendRemoveLiquidity(
        provider: ContractProvider,
        via: Sender,
        opts: {
            sender: Address;
            lpWalletAddress: Address;
            amount: bigint;
        }
    ) {

        await via.send({
            to: opts.lpWalletAddress,
            value: toNano('0.2'),
            body: PoolV1.removeLiquidityMessage(opts.sender, opts),
        });
    }

    // GETTERS

    async getLPWalletAddress(provider: ContractProvider, owner: Address): Promise<Address> {
        const res = await provider.get('get_wallet_address', [
            { type: 'slice', cell: beginCell().storeAddress(owner).endCell() },
        ]);
        return res.stack.readAddress();
    }

    async getAssets(provider: ContractProvider): Promise<{
        asset0: {
            type: bigint;
            address: Address;
        };
        asset1: {
            type: bigint;
            address: Address;
        };
    }> {
        const res = await provider.get('get_assets', []);
        const asset0Type = res.stack.readBigNumber();
        const asset0AddressInt = res.stack.readBigNumber();
        const asset0Address = convertBigIntToAddress(asset0AddressInt);

        const asset1Type = res.stack.readBigNumber();
        const asset1AddressInt = res.stack.readBigNumber();
        const asset1Address = convertBigIntToAddress(asset1AddressInt);

        return {
            asset0: {
                type: asset0Type,
                address: asset0Address,
            },
            asset1: {
                type: asset1Type,
                address: asset1Address,
            },
        };
    }

    async getReserves(provider: ContractProvider): Promise<{
        asset0: {
            type: bigint;
            address: Address;
            reserve: bigint;
        };
        asset1: {
            type: bigint;
            address: Address;
            reserve: bigint;
        };
    }> {
        const res = await provider.get('get_assets_full', []);
        const asset0Type = res.stack.readBigNumber();
        const asset0AddressInt = res.stack.readBigNumber();
        const asset0Address = convertBigIntToAddress(asset0AddressInt);
        const asset0Reserve = res.stack.readBigNumber();

        const asset1Type = res.stack.readBigNumber();
        const asset1AddressInt = res.stack.readBigNumber();
        const asset1Address = convertBigIntToAddress(asset1AddressInt);
        const asset1Reserve = res.stack.readBigNumber();

        return {
            asset0: {
                type: asset0Type,
                address: asset0Address,
                reserve: asset0Reserve,
            },
            asset1: {
                type: asset1Type,
                address: asset1Address,
                reserve: asset1Reserve,
            },
        };
    }

    async getStatus(provider: ContractProvider) {
        const res = await provider.get('get_pool_status', []);
        const status = res.stack.readNumber();
        return status as PoolStatus;
    }

    async getJettonData(provider: ContractProvider) {
        const res = await provider.get('get_jetton_data', []);
        const totalSupply = res.stack.readBigNumber();
        const mintable = res.stack.readBoolean();
        const adminAddress = res.stack.readAddress();
        const content = res.stack.readCell();
        const walletCode = res.stack.readCell();
        return {
            totalSupply,
            mintable,
            adminAddress,
            content,
            walletCode,
        };
    }

    async getTotalSupply(provider: ContractProvider) {
        const res = await this.getJettonData(provider);
        return res.totalSupply;
    }
}
