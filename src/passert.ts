import { phoist, pfn, bool, unit, pif, pmakeUnit, perror } from "@harmoniclabs/plu-ts";

export const passert = phoist(
    pfn([ bool ], unit )
    ( condition =>
        pif( unit ).$( condition )
        .then( pmakeUnit() )
        .else( perror( unit ) )
    )
);