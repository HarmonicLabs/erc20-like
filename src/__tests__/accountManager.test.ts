import { Machine } from "@harmoniclabs/plutus-machine"
import { AccountFactoryRdmr, AccountManagerRdmr, accountManager } from "..";
import { FreezeableAccount } from "../types/Account";
import { Application, PScriptContext, Term, UPLCConst, dataFromCbor, pData } from "@harmoniclabs/plu-ts";

describe("accountManager", () => {

    const managerUPLC = accountManager.toUPLC();

    test("Mint", () => {

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

    test.only("Transfer", () => {

        const datum = pData(
            dataFromCbor(
                "d8799f192710d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581caf1d0fb8e50c53c10e882d3b57d6d81660e780b67b34e97b1d467feed87980ff"
            )
        ).toUPLC();
        const rdmr = pData(
            dataFromCbor(
                // Transfer({ to: "9BE739F23290DA863631A61B5A4932212ECBAE8A5FD8CF0EA59B4889" , amount: 5000 })
                "d87a9fd8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff191388ff"
            )
        ).toUPLC()
        const ctx = pData(
            dataFromCbor(
                "d8799fd8799f9fd8799fd8799fd8799f5820c9ad277225b018eb4f547217756fa84958b6623469cc11faa4834b2b75bec77eff00ffd8799fd8799fd87a9f581cc79c0cee65e1128169bfe217639c6aff2d95c47b8a424e73e84ed762ffd87a80ffbf40bf401a004c4b40ff581caf1d0fb8e50c53c10e882d3b57d6d81660e780b67b34e97b1d467feebf5820990d2113d975fc10106a53efb33c90d0c675b79bc5fb260d1892938be2c7efdd01ffffd87b9fd8799f192710d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581caf1d0fb8e50c53c10e882d3b57d6d81660e780b67b34e97b1d467feed87980ffffd87a80ffffd8799fd8799fd8799f5820dd11d8d28c0791ae64aa4da21eb7895ba5cf189ac712cde43041a49ad0a27877ff00ffd8799fd8799fd87a9f581cc79c0cee65e1128169bfe217639c6aff2d95c47b8a424e73e84ed762ffd87a80ffbf40bf401a004c4b40ff581caf1d0fb8e50c53c10e882d3b57d6d81660e780b67b34e97b1d467feebf5820da5a31022a86ae17eed7a78674260087b7775292561333e3ae442d68dda1571601ffffd87b9fd8799f00d8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff581caf1d0fb8e50c53c10e882d3b57d6d81660e780b67b34e97b1d467feed87980ffffd87a80ffffd8799fd8799fd8799f5820c9ad277225b018eb4f547217756fa84958b6623469cc11faa4834b2b75bec77eff01ffd8799fd8799fd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffd87a80ffbf40bf401b00000002531352d9ffffd87980d87a80ffffff809fd8799fd8799fd87a9f581cc79c0cee65e1128169bfe217639c6aff2d95c47b8a424e73e84ed762ffd87a80ffbf40bf401a004c4b40ff581caf1d0fb8e50c53c10e882d3b57d6d81660e780b67b34e97b1d467feebf5820990d2113d975fc10106a53efb33c90d0c675b79bc5fb260d1892938be2c7efdd01ffffd87b9fd8799f191388d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581caf1d0fb8e50c53c10e882d3b57d6d81660e780b67b34e97b1d467feed87980ffffd87a80ffd8799fd8799fd87a9f581cc79c0cee65e1128169bfe217639c6aff2d95c47b8a424e73e84ed762ffd87a80ffbf40bf401a004c4b40ff581caf1d0fb8e50c53c10e882d3b57d6d81660e780b67b34e97b1d467feebf5820da5a31022a86ae17eed7a78674260087b7775292561333e3ae442d68dda1571601ffffd87b9fd8799f191388d8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff581caf1d0fb8e50c53c10e882d3b57d6d81660e780b67b34e97b1d467feed87980ffffd87a80ffd8799fd8799fd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffd87a80ffbf40bf401b00000002530d5cb4ffffd87980d87a80ffffbf40bf401a0005f625ffffbf40bf4000ffff80a0d8799fd8799fd87980d87980ffd8799fd87b80d87980ffff9f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffbfd87a9fd8799fd8799f5820c9ad277225b018eb4f547217756fa84958b6623469cc11faa4834b2b75bec77eff00ffffd87a9fd8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff191388ffd87a9fd8799fd8799f5820dd11d8d28c0791ae64aa4da21eb7895ba5cf189ac712cde43041a49ad0a27877ff00ffffd87b80ffa05820a0dd2a1b3d24679acb1f357c84ff0474d9811c32f6e94a32cdecdcc90bd50576ffd87a9fd8799fd8799f5820c9ad277225b018eb4f547217756fa84958b6623469cc11faa4834b2b75bec77eff00ffffff"
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
    
});