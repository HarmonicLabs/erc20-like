import { PCredential, PCurrencySymbol, int, pstruct } from "@harmoniclabs/plu-ts";

export const FreezeableAccountState = pstruct({
    Ok: {}, // Constr index 0; free to spend
    Frozen: {} // Constr index 1; frozen
});

export const FreezeableAccount = pstruct({
    Account: {
        amount: int,
        credentials: PCredential.type,
        currencySym: PCurrencySymbol.type,
        state: FreezeableAccountState.type
    }
})