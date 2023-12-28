import { PCredential, PCurrencySymbol, int, pstruct } from "@harmoniclabs/plu-ts";

export const FreezeableAccountState = pstruct({
    Ok: {},
    Frozen: {}
});

export const FreezeableAccount = pstruct({
    Account: {
        amount: int,
        credentials: PCredential.type,
        currencySym: PCurrencySymbol.type,
        state: FreezeableAccountState.type
    }
})