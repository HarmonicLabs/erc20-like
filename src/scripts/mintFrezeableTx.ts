import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts"
import { Address, DataB, DataConstr, DataI, PCredential, PaymentCredentials, PrivateKey, TxBuilder, Value, dataToCbor, eqData, isData, pData, pDataB, pDataI } from "@harmoniclabs/plu-ts";
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
        await blockfrost.getProtocolParameters()
    );

    const myAddr = Address.fromString( await readFile("./fst.addr", "utf8" ) );
    const myUTxOs = await blockfrost.addressUtxos( myAddr );

    const { accountFactory, accountManager } = await readContracts();

    const accountManagerAddr = Address.testnet( PaymentCredentials.script( accountManager.hash) );
    const contractUtxos = await blockfrost.addressUtxos( accountManagerAddr );
    const myAccountUtxo = contractUtxos.find( u => 
        ( u.resolved.datum instanceof DataConstr ) &&
        eqData( 
            u.resolved.datum.fields[0],
            new DataI( 0 )
        ) &&
        eqData( 
            u.resolved.datum.fields[1],
            myAddr.paymentCreds.toData()
        ) && (
            u.resolved.datum.fields[3] instanceof DataConstr &&
            u.resolved.datum.fields[3].constr === BigInt(0) // state === ok
        )
    );

    if( !myAccountUtxo )
    {
        console.log(
            JSON.stringify(
                contractUtxos.map( u => u.toJson() ),
                undefined,
                2
            )
        );
        throw new Error("missing");
    }

    const prvt = PrivateKey.fromCbor(
        JSON.parse(
            await readFile("./fst.skey", "utf8")
        ).cborHex
    );

    const utxo = myUTxOs[0];

    const mintAmt = BigInt( 10_000 );
    const inputErc20Qty = ((myAccountUtxo.resolved.datum as DataConstr).fields[0] as DataI).int;
    const state = (myAccountUtxo.resolved.datum as DataConstr).fields[3];

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
                datum: new DataConstr(
                    0,
                    [
                        new DataI( inputErc20Qty + mintAmt ),
                        myAddr.paymentCreds.toData(),
                        new DataB( accountFactory.hash.toBuffer() ),
                        state
                    ]
                )
            }
        ],
        changeAddress: myAddr
    });

    tx.signWith( prvt );

    const hash = await blockfrost.submitTx( tx );

    console.log( hash.toString() );
}()