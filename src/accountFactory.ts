import { PAssetsEntry, PBool, PScriptContext, PValidatorHash, Term, bool, bs, data, list, pBSToData, pDataI, perror, pfn, phoist, pif, pisEmpty, plet, plookup, pmakeUnit, pmatch, pnot, pserialiseData, psha2_256, pstruct, punBData, punsafeConvertType, unit } from "@harmoniclabs/plu-ts";
import { FreezeableAccount, FreezeableAccountState } from "./types/Account";
import { passert } from "./passert";

export const AccountFactoryRdmr = pstruct({
    New: {}, // Mint
    Delete: {} // Burn
})



export const accountFactory = pfn([
    PValidatorHash.type,
    AccountFactoryRdmr.type,
    PScriptContext.type
],  unit)
(( accountManagerHash, rdmr, { tx, purpose }) => {
    
    const ownPolicy = plet(
        pmatch( purpose )
        .onMinting(({ currencySym }) => currencySym )
        ._(_ => perror( bs ))
    );
    
    return passert.$(
        pmatch( rdmr )
        .onDelete( _ => 
            tx.mint.every(({ fst: policy, snd: assets }) =>
                pnot.$( policy.eq( ownPolicy ) )
                .or(
                    assets.every(({ snd: qty }) => qty.lt( 0 ) )
                )
            )
        )
        .onNew( _ => {

            // inlined
            const onlyOneInput = pisEmpty.$( tx.inputs.tail );

            const { utxoRef, resolved: fstIn } = tx.inputs.head;

            const expectedAssetName = plet(
                psha2_256.$(
                    pserialiseData.$(
                        punsafeConvertType(
                            utxoRef,
                            data
                        )
                    )
                )
            );

            // inlined
            const inputHasNoOwnTokens = fstIn.value.every(({ fst: policy, snd: assets }) =>
                pnot.$( policy.eq( ownPolicy ) )
            );

            const ownMintedAssets = plet(
                pmatch(
                    tx.mint.find(({ fst: policy }) => policy.eq( ownPolicy ) )
                )
                .onJust(({ val: { snd: assets } }) => assets )
                .onNothing( _ => perror( list( PAssetsEntry.type ) ) )
            );

            // inlined
            const singleOwnAsset = pisEmpty.$( ownMintedAssets.tail );

            const { fst: ownAssetName, snd: ownAssetQty } = ownMintedAssets.head;

            // inlined
            const correctMint = singleOwnAsset
            .and( ownAssetName.eq( expectedAssetName ) )
            .and( ownAssetQty.eq( 1 ) );
            
            const fstOut = tx.outputs.head;

            // inlined
            const fstOutToManager = pmatch( fstOut.address.credential )
            .onPScriptCredential(({ valHash }) => valHash.eq( accountManagerHash ) )
            .onPPubKeyCredential( _ => perror( bool ) );

            // inlined
            const correctOutput =
            // going to account manager
            fstOutToManager
            // has nft
            .and( fstOut.value.amountOf( ownPolicy, ownAssetName ).eq( 1 ) )
            // correct output datum
            .and(
                pmatch( fstOut.datum )
                .onInlineDatum(({ datum }) => punsafeConvertType( datum, FreezeableAccount.type ).eq(
                    FreezeableAccount.Account({
                        amount: pDataI( 0 ),
                        currencySym: pBSToData.$( ownPolicy ),
                        credentials: punsafeConvertType(fstIn.address.credential, data),
                        state: punsafeConvertType(FreezeableAccountState.Ok({}), data)
                    })
                ))
                ._(_ => perror( bool )) as Term<PBool>
            )
            
            return onlyOneInput
            .and( inputHasNoOwnTokens )
            .and( correctMint )
            .and( correctOutput )
        })
    );
});