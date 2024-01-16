import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts"
import { Address, DataConstr, PCredential, PaymentCredentials, PrivateKey, TxBuilder, Value, dataToCbor, pData, pDataB, pDataI } from "@harmoniclabs/plu-ts";
import { readFile } from "fs/promises";
import { readContracts } from "./utils/readContracts";
import { sha2_256 } from "@harmoniclabs/crypto";
import { FreezeableAccount, FreezeableAccountState } from "../types/Account";

void async function createAccountTx()
{
    const blockfrost = new BlockfrostPluts({
        projectId: await readFile("./blockfrost.skey", "utf8")
    });

    const txBuilder = new TxBuilder(
        await blockfrost.getProtocolParameters(),
        await blockfrost.getGenesisInfos()
    );

    const myAddr = Address.fromString( await readFile("./snd.addr", "utf8" ) );
    const myUTxOs = await blockfrost.addressUtxos( myAddr );

    const { accountFactory, accountManager } = await readContracts();

    const prvt = PrivateKey.fromCbor(
        JSON.parse(
            await readFile("./snd.skey", "utf8")
        ).cborHex
    );

    const utxo = myUTxOs[0];

    const expectedAssetName = new Uint8Array(
        sha2_256(
            dataToCbor( utxo.utxoRef.toData() ).toBuffer()
        )
    );

    const tx = txBuilder.buildSync({
        inputs: [
            { utxo }
        ],
        collaterals: [ utxo ],
        mints: [
            {
                value: Value.singleAsset( accountFactory.hash, expectedAssetName, 1 ),
                script: {
                    inline: accountFactory,
                    policyId: accountFactory.hash,
                    redeemer: new DataConstr(0,[])
                }
            }
        ],
        outputs: [
            {
                address: Address.testnet( PaymentCredentials.script( accountManager.hash) ),
                value: new Value([
                    Value.lovelaceEntry( 5_000_000 ),
                    Value.singleAssetEntry( accountFactory.hash, expectedAssetName, 1 )
                ]),
                datum: FreezeableAccount.Account({
                    amount: pDataI( 0 ),
                    currencySym: pDataB( accountFactory.hash.toBuffer() ),
                    credentials: PCredential.fromData( pData( utxo.resolved.address.paymentCreds.toData() ) ) as any,
                    state: FreezeableAccountState.Ok({})
                })
            }
        ],
        changeAddress: myAddr
    });

    tx.signWith( prvt );

    const hash = await blockfrost.submitTx( tx );

    console.log( hash.toString() );
}()