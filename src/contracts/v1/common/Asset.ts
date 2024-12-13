import { Address, beginCell, Builder, Slice, type Writable } from '@ton/core';
import { convertAddressToBigInt, convertBigIntToAddress } from '../../../utils/address-utils';
import { AssetType } from './AssetTypes';

export class Asset implements Writable {
    constructor(
        readonly type: 0 | 1,
        readonly address: bigint
    ) {}

    static native() {
        return new Asset(
            AssetType.NATIVE,
            convertAddressToBigInt(
                Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c')
            )
        );
    }

    static token(address: Address) {
        const addressInt = convertAddressToBigInt(address);
        return new Asset(AssetType.JETTON, addressInt);
    }

    static fromSlice(slice: Slice) {
        const ref = slice.loadRef().beginParse();
        const assetType = ref.loadUint(1);
        const addressInt = ref.loadUintBig(256);

        switch (assetType) {
            case AssetType.NATIVE:
                return Asset.native();
            case AssetType.JETTON:
                return Asset.token(convertBigIntToAddress(addressInt));
            default:
                throw new Error('Invalid asset type');
        }
    }

    equals(other: Asset) {
        return this.toString() === other.toString();
    }

    writeTo(builder: Builder) {
        switch (this.type) {
            case AssetType.NATIVE: {
                const ref = new Builder();
                ref.storeUint(AssetType.NATIVE, 1);
                const addressInt = convertAddressToBigInt(
                    Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c')
                );
                ref.storeUint(addressInt, 256);
                builder.storeRef(ref.endCell());
                break;
            }
            case AssetType.JETTON: {
                const ref = new Builder();
                ref.storeUint(AssetType.JETTON, 1);
                ref.storeUint(this.address, 256);
                builder.storeRef(ref.endCell());
                break;
            }
            default:
                throw new Error('Invalid asset type');
        }
    }

    toSlice(): Slice {
        return beginCell().storeWritable(this).endCell().beginParse();
    }

    toString() {
        return `Asset:(${this.type}:${this.address})`;
    }
}

// export const TON_ASSET = {
//     type: 0n,
//     address: Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'),
// } satisfies Asset;

// export function storeAsset(src: Asset) {
//     return (builder: Builder) => {
//         const b_0 = builder;
//         const b_1 = new Builder();
//         b_1.storeUint(src.type, 1);
//         const addressInt = convertAddressToBigInt(src.address);
//         b_1.storeUint(addressInt, 256);
//         b_0.storeRef(b_1.endCell());
//     };
// }

// export const sortAssets = (asset0: Asset, asset1: Asset): [Asset, Asset] => {
//     const asset0Hash = BigInt(
//         '0x' + new Builder().store(storeAsset(asset0)).endCell().hash().toString('hex')
//     );

//     const asset1Hash = BigInt(
//         '0x' + new Builder().store(storeAsset(asset1)).endCell().hash().toString('hex')
//     );

//     if (asset0Hash > asset1Hash) {
//         return [asset0, asset1];
//     } else {
//         return [asset1, asset0];
//     }
// };
