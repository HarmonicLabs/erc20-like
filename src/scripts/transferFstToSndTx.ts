import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts";
import { Address, DataConstr, DataI, PCredential, PaymentCredentials, PrivateKey, TxBuilder, eqData, pData, pDataB, pDataI } from "@harmoniclabs/plu-ts";
import { readFile } from "fs/promises";
import { FreezeableAccount, FreezeableAccountState } from "../types/Account";
import { readContracts } from "./utils/readContracts";

void async function transferFstToSndTx()
{
    const blockfrost = new BlockfrostPluts({
        projectId: await readFile("./blockfrost.skey", "utf8")
    });

    const txBuilder = new TxBuilder(
        await blockfrost.getProtocolParameters(),
        await blockfrost.getGenesisInfos()
    );

    const fstAddr = Address.fromString( await readFile("./fst.addr", "utf8" ) );
    const sndAddr = Address.fromString( await readFile("./snd.addr", "utf8" ) );
    const fstUTxOs = await blockfrost.addressUtxos( fstAddr );

    const { accountFactory, accountManager } = await readContracts();

    const accountManagerAddr = Address.testnet( PaymentCredentials.script( accountManager.hash) );
    const contractUtxos = await blockfrost.addressUtxos( accountManagerAddr );
    
    const myAccountUtxo = contractUtxos.find( u => 
        ( u.resolved.datum instanceof DataConstr ) &&
        eqData( 
            u.resolved.datum.fields[1],
            fstAddr.paymentCreds.toData()
        ) && (
            u.resolved.datum.fields[0] instanceof DataI && // amount
            u.resolved.datum.fields[0].int >= BigInt( 9_999 )
        )
    );
    if( !myAccountUtxo ) throw new Error("missing myAccountUtxo");

    const sndAccountUtxo = contractUtxos.find( u => 
        ( u.resolved.datum instanceof DataConstr ) &&
        eqData( 
            u.resolved.datum.fields[1],
            sndAddr.paymentCreds.toData()
        )
    );
    if( !sndAccountUtxo ) throw new Error("missing sndAccountUtxo");


    const inputErc20Qty = ((myAccountUtxo.resolved.datum as DataConstr).fields[0] as DataI).int;
    const change = BigInt( 5000 );
    const amtSent = inputErc20Qty - change

    const prvt = PrivateKey.fromCbor(
        JSON.parse(
            await readFile("./fst.skey", "utf8")
        ).cborHex
    );

    const utxo = fstUTxOs[0];

    const tx = txBuilder.buildSync({
        inputs: [
            {
                utxo: myAccountUtxo,
                inputScript: {
                    script: accountManager,
                    datum: "inline",
                    redeemer: new DataConstr(
                        1, // Transfer
                        [
                            // to
                            sndAddr.paymentCreds.toData(),
                            // amount
                            new DataI( amtSent )
                        ]
                    )
                }
            },
            {
                utxo: sndAccountUtxo,
                inputScript: {
                    script: accountManager,
                    datum: "inline",
                    redeemer: new DataConstr( 2, [] ) // Receive
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
                    amount: pDataI( change ),
                    currencySym: pDataB( accountFactory.hash.toBuffer() ),
                    credentials: PCredential.fromData( pData( fstAddr.paymentCreds.toData() ) ) as any,
                    state: FreezeableAccountState.Ok({})
                })
            },
            {
                address: accountManagerAddr,
                value: sndAccountUtxo.resolved.value,
                datum: FreezeableAccount.Account({
                    amount: pDataI( amtSent ),
                    currencySym: pDataB( accountFactory.hash.toBuffer() ),
                    credentials: PCredential.fromData( pData( sndAddr.paymentCreds.toData() ) ) as any,
                    state: FreezeableAccountState.Ok({})
                })
            }
        ],
        requiredSigners: [ fstAddr.paymentCreds.hash ],
        changeAddress: fstAddr
    });

    tx.signWith( prvt );

    const hash = await blockfrost.submitTx( tx );

    console.log( hash.toString() );
}()