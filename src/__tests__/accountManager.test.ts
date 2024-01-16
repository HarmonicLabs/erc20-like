import { Machine } from "@harmoniclabs/plutus-machine"
import { AccountManagerRdmr, accountManager } from "..";
import { FreezeableAccount } from "../types/Account";
import { PScriptContext, dataFromCbor, pData } from "@harmoniclabs/plu-ts";

describe("accountManager", () => {

    test("Mint", () => {

        const datum = FreezeableAccount.fromData(
            pData(
                dataFromCbor(
                    "d8799f00d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589d87980ff"
                )
            )
        );
        const rdmr = AccountManagerRdmr.fromData(
            pData(
                dataFromCbor(
                    "d8799f192710ff" // Mint({ amount: 10_000 })
                )
            )
        );
        const ctx = PScriptContext.fromData(
            pData(
                dataFromCbor(
                    "d8799fd8799f9fd8799fd8799fd8799f5820d44a57115bea6df057853dffcc582c87e5cccac4440ef3340964aec54a36bb15ff00ffd8799fd8799fd87a9f581ca55c7da54808d27150d391c5a886343e29ab4848354d1c8a82e949c9ffd87a80ffbf40bf401a004c4b40ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589bf5820057b53569e63bdd7c1ad0f7580431bf7368782a102911d1368cc3b26493dd62001ffffd87b9fd8799f00d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589d87980ffffd87a80ffffd8799fd8799fd8799f5820d44a57115bea6df057853dffcc582c87e5cccac4440ef3340964aec54a36bb15ff01ffd8799fd8799fd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffd87a80ffbf40bf401b0000000253bc180cffffd87980d87a80ffffff809fd8799fd8799fd87a9f581ca55c7da54808d27150d391c5a886343e29ab4848354d1c8a82e949c9ffd87a80ffbf40bf401a004c4b40ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589bf5820057b53569e63bdd7c1ad0f7580431bf7368782a102911d1368cc3b26493dd62001ffffd87b9fd8799f192710d8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c420c38efe75db1521342eac96875412e652c58410314472b017cc589d87980ffffd87a80ffd8799fd8799fd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ffd87a80ffbf40bf401b0000000253b813a7ffffd87980d87a80ffffbf40bf401a00040465ffffbf40bf4000ffff80a0d8799fd8799fd87980d87980ffd8799fd87b80d87980ffff80bfd87a9fd8799fd8799f5820d44a57115bea6df057853dffcc582c87e5cccac4440ef3340964aec54a36bb15ff00ffffd8799f192710ffffa058205601bfc78b1400a9bbf6e779e08073a4dba31f8931e44a34036de8e55b91d188ffd87a9fd8799fd8799f5820d44a57115bea6df057853dffcc582c87e5cccac4440ef3340964aec54a36bb15ff00ffffff"
                )
            )
        )

        const res = Machine.eval(
            accountManager
            .$( datum )
            .$( rdmr )
            .$( ctx )
        );

        console.log( res );
    })
})