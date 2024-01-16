import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts"
import { Address, DataConstr, DataI, PCredential, PaymentCredentials, PrivateKey, TxBuilder, Value, dataToCbor, eqData, isData, pData, pDataB, pDataI } from "@harmoniclabs/plu-ts";
import { readFile } from "fs/promises";
import { readContracts } from "./utils/readContracts";
import { sha2_256 } from "@harmoniclabs/crypto";
import { FreezeableAccount, FreezeableAccountState } from "../types/Account";

void async function mintFrezeableTx()
{
    const blockfrost = new BlockfrostPluts({
        projectId: await readFile("./blockfrost.skey", "utf8")
    });

    const txBuilder = new TxBuilder(
        await blockfrost.getProtocolParameters(),
        await blockfrost.getGenesisInfos()
    );

    const myAddr = Address.fromString( await readFile("./fst.addr", "utf8" ) );
    const myUTxOs = await blockfrost.addressUtxos( myAddr );

    const { accountFactory, accountManager } = await readContracts();

    const accountManagerAddr = Address.testnet( PaymentCredentials.script( accountManager.hash) );
    const contractUtxos = await blockfrost.addressUtxos( accountManagerAddr );
    const myAccountUtxo = contractUtxos.find( u => 
        ( u.resolved.datum instanceof DataConstr ) &&
        eqData( 
            u.resolved.datum.fields[1],
            myAddr.paymentCreds.toData()
        )
    );

    if( !myAccountUtxo ) throw new Error("missing");

    const prvt = PrivateKey.fromCbor(
        JSON.parse(
            await readFile("./fst.skey", "utf8")
        ).cborHex
    );

    const utxo = myUTxOs[0];

    const mintAmt = 10_000;

    const tx = txBuilder.buildSync({
        inputs: [
            {
                utxo: myAccountUtxo,
                inputScript: {
                    script: accountManager,
                    datum: "inline",
                    redeemer: new DataConstr( 0, [ new DataI( mintAmt ) ] )
                }
            },
            { utxo }
        ],
        collaterals: [ utxo ],
        outputs: [
            {
                address: accountManagerAddr,
                value: myAccountUtxo.resolved.value,
                datum: FreezeableAccount.Account({
                    amount: pDataI( mintAmt ),
                    currencySym: pDataB( accountFactory.hash.toBuffer() ),
                    credentials: PCredential.fromData( pData( myAddr.paymentCreds.toData() ) ) as any,
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