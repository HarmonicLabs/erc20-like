import { Machine } from "@harmoniclabs/plutus-machine"
import { AccountFactoryRdmr, AccountManagerRdmr, accountManager } from "..";
import { FreezeableAccount } from "../types/Account";
import { Address, Application, DataB, DataConstr, DataI, PScriptContext, Term, UPLCConst, dataFromCbor, dataToCbor, pData } from "@harmoniclabs/plu-ts";
import { readContracts } from "../scripts/utils/readContracts";
import { readFile, writeFile } from "fs/promises";

describe("accountManager", () => {

    const managerUPLC = UPLCConst.unit// accountManager.toUPLC();

    test.skip("Mint", () => {

        const datum = pData(
            dataFromCbor(
                "d8799f00d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589d87980ff"
            )
        ).toUPLC();
        const rdmr = pData(
            dataFromCbor(
                "d8799f192710ff" // Mint({ amount: 10_000 })
            )
        ).toUPLC()
        const ctx = pData(
            dataFromCbor(
                "d8799fd8799f9fd8799fd8799fd8799f5820d44a57115bea6df057853dffcc582c87e5cccac4440ef3340964aec54a36bb15ff00ffd8799fd8799fd87a9f581ca55c7da54808d27150d391c5a886343e29ab4848354d1c8a82e949c9ffd87a80ffbf40bf401a004c4b40ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589bf5820057b53569e63bdd7c1ad0f7580431bf7368782a102911d1368cc3b26493dd62001ffffd87b9fd8799f00d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589d87980ffffd87a80ffffd8799fd8799fd8799f5820d44a57115bea6df057853dffcc582c87e5cccac4440ef3340964aec54a36bb15ff01ffd8799fd8799fd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffd87a80ffbf40bf401b0000000253bc180cffffd87980d87a80ffffff809fd8799fd8799fd87a9f581ca55c7da54808d27150d391c5a886343e29ab4848354d1c8a82e949c9ffd87a80ffbf40bf401a004c4b40ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589bf5820057b53569e63bdd7c1ad0f7580431bf7368782a102911d1368cc3b26493dd62001ffffd87b9fd8799f192710d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589d87980ffffd87a80ffd8799fd8799fd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffd87a80ffbf40bf401b0000000253b813a7ffffd87980d87a80ffffbf40bf401a00040465ffffbf40bf4000ffff80a0d8799fd8799fd87980d87980ffd8799fd87b80d87980ffff80bfd87a9fd8799fd8799f5820d44a57115bea6df057853dffcc582c87e5cccac4440ef3340964aec54a36bb15ff00ffffd8799f192710ffffa058205601bfc78b1400a9bbf6e779e08073a4dba31f8931e44a34036de8e55b91d188ffd87a9fd8799fd8799f5820d44a57115bea6df057853dffcc582c87e5cccac4440ef3340964aec54a36bb15ff00ffffff"
            )
        ).toUPLC();

        const res = Machine.eval(
            new Application(
                new Application(
                    new Application(
                        managerUPLC,
                        datum
                    ),
                    rdmr
                ),
                ctx
            )
        );

        console.log( res );
        expect( res.result instanceof UPLCConst ).toBe( true );
    });

    test.skip("Transfer", () => {

        const datum = pData(
            dataFromCbor(
                "d8799f192710d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c5b369ae192fb259d86334bdd9a44009d6c758923d196ff692f732912d87980ff"
            )
        ).toUPLC();
        const rdmr = pData(
            dataFromCbor(
                // Transfer({ to: "9BE739F23290DA863631A61B5A4932212ECBAE8A5FD8CF0EA59B4889" , amount: 100 })
                "d87a9fd8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff1864ff"
            )
        ).toUPLC()
        const ctx = pData(
            dataFromCbor(
                "d8799fd8799f9fd8799fd8799fd8799f5820dcc33bce88fab7459163586d812b24697519f0a1a86dc80d1e8928c4391aa6baff00ffd8799fd8799fd87a9f581c9c886b6f783928f39a648fed28a29c4cbbe5ef39141ba51905d0bdbeffd87a80ffbf40bf401a004c4b40ff581c5b369ae192fb259d86334bdd9a44009d6c758923d196ff692f732912bf5820c226dd2c5ca30b0bab79a8e323097b86b9870e647f44f3580dd1be1c7fe5d98b01ffffd87b9fd8799f192710d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c5b369ae192fb259d86334bdd9a44009d6c758923d196ff692f732912d87980ffffd87a80ffffd8799fd8799fd8799f582085d7ab1e53136641c80b726a7e5c15e48a0fe6c66e3f5f7300f7f57186ed04ccff00ffd8799fd8799fd87a9f581c9c886b6f783928f39a648fed28a29c4cbbe5ef39141ba51905d0bdbeffd87a80ffbf40bf401a004c4b40ff581c5b369ae192fb259d86334bdd9a44009d6c758923d196ff692f732912bf5820107270dd5bc4aecb583ee1dd5f380e6a618ab32f84ac2fbdca33b806e985e00601ffffd87b9fd8799f00d8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff581c5b369ae192fb259d86334bdd9a44009d6c758923d196ff692f732912d87980ffffd87a80ffffd8799fd8799fd8799f5820dcc33bce88fab7459163586d812b24697519f0a1a86dc80d1e8928c4391aa6baff01ffd8799fd8799fd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffd87a80ffbf40bf401b0000000252bebc36ffffd87980d87a80ffffff809fd8799fd8799fd87a9f581c9c886b6f783928f39a648fed28a29c4cbbe5ef39141ba51905d0bdbeffd87a80ffbf40bf401a004c4b40ff581c5b369ae192fb259d86334bdd9a44009d6c758923d196ff692f732912bf5820c226dd2c5ca30b0bab79a8e323097b86b9870e647f44f3580dd1be1c7fe5d98b01ffffd87b9fd8799f1926acd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c5b369ae192fb259d86334bdd9a44009d6c758923d196ff692f732912d87980ffffd87a80ffd8799fd8799fd87a9f581c9c886b6f783928f39a648fed28a29c4cbbe5ef39141ba51905d0bdbeffd87a80ffbf40bf401a004c4b40ff581c5b369ae192fb259d86334bdd9a44009d6c758923d196ff692f732912bf5820107270dd5bc4aecb583ee1dd5f380e6a618ab32f84ac2fbdca33b806e985e00601ffffd87b9fd8799f1864d8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff581c5b369ae192fb259d86334bdd9a44009d6c758923d196ff692f732912d87980ffffd87a80ffd8799fd8799fd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffd87a80ffbf40bf401b0000000252b86ba9ffffd87980d87a80ffffbf40bf401a0006508dffffbf40bf4000ffff80a0d8799fd8799fd87980d87980ffd8799fd87b80d87980ffff9f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffbfd87a9fd8799fd8799f5820dcc33bce88fab7459163586d812b24697519f0a1a86dc80d1e8928c4391aa6baff00ffffd87a9fd8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff1864ffd87a9fd8799fd8799f582085d7ab1e53136641c80b726a7e5c15e48a0fe6c66e3f5f7300f7f57186ed04ccff00ffffd87b80ffa058200445a26fa394ba28b95be4cf648ff7d55742bb3dccb19bb86c3f3a4bb6c836f8ffd87a9fd8799fd8799f5820dcc33bce88fab7459163586d812b24697519f0a1a86dc80d1e8928c4391aa6baff00ffffff"
            )
        ).toUPLC();

        const res = Machine.eval(
            new Application(
                new Application(
                    new Application(
                        managerUPLC,
                        datum
                    ),
                    rdmr
                ),
                ctx
            )
        );

        console.log( res );
        expect( res.result instanceof UPLCConst ).toBe( true );
    });

    test.skip("data str", async () => {

        const { accountFactory, accountManager } = await readContracts();
// 
        const sndAddr = Address.fromString( await readFile("./snd.addr", "utf8" ) );
        // const amtSent = BigInt( 100 );
// 
        // await writeFile("./accountManager.plutus.json", JSON.stringify( accountManager.toJson() ) );
        // await writeFile("./transfer_rdmr.cbor", dataToCbor(new DataConstr(
        //     1, // Transfer
        //     [
        //         // to
        //         sndAddr.paymentCreds.toData(),
        //         // amount
        //         new DataI( amtSent )
        //     ]
        // )).toBuffer() );

        const fstAddr = Address.fromString( await readFile("./fst.addr", "utf8" ) );
    
        // await writeFile("./rcv_rdmr.cbor", dataToCbor(new DataConstr( 2, [] )).toBuffer() );
        await writeFile("./senderOutDat.cbor", dataToCbor(
                new DataConstr(
                    0,
                    [
                        new DataI( 9900 ),
                        fstAddr.paymentCreds.toData(),
                        new DataB( accountFactory.hash.toBuffer() ),
                        new DataConstr(0,[])
                    ]
                )
            ).toBuffer() );
        await writeFile("./receiverOutDat.cbor", dataToCbor(
            new DataConstr(
                0,
                [
                    new DataI( 100 ),
                    sndAddr.paymentCreds.toData(),
                    new DataB( accountFactory.hash.toBuffer() ),
                    new DataConstr(0,[])
                ]
            )
        ).toBuffer() );
        
        
    })
    
});