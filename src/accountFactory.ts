import { PAssetsEntry, PBool, PScriptContext, PValidatorHash, Term, bool, bs, data, int, list, pBSToData, pDataI, perror, pfn, phoist, pif, pisEmpty, plet, plookup, pmakeUnit, pmatch, pnot, pserialiseData, psha2_256, pstruct, punBData, punsafeConvertType, unit } from "@harmoniclabs/plu-ts";
import { FreezeableAccount, FreezeableAccountState } from "./types/Account";
import { passert } from "./passert";

export const AccountFactoryRdmr = pstruct({
    New: { inputIdx: int }, // Mint
    Delete: {} // Burn
});

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
            tx.mint.some(({ fst: policy, snd: assets }) =>
                policy.eq( ownPolicy )
                .and(
                    assets.every(({ snd: qty }) => qty.lt( 0 ) )
                )
            )
        )
        .onNew(({ inputIdx }) => {

            // inlined
            const onlyOneInput = pisEmpty.$( tx.inputs.tail );

            const { utxoRef, resolved: chosenInput } = tx.inputs.at( inputIdx );

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
            const inputHasNoOwnTokens = chosenInput.value.every(({ fst: policy }) =>
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
            .onPPubKeyCredential( _ => perror( bool ) )
            .and(
                fstOut.address.stakingCredential.eq(
                    chosenInput.address.stakingCredential
                )
            );

            // inlined
            const correctOutput =
            // going to account manager
            fstOutToManager
            // has nft
            .and( fstOut.value.amountOf( ownPolicy, ownAssetName ).eq( 1 ) )
            // prevents DoS by token spam
            .and( fstOut.value.length.eq( 2 ) )
            // correct output datum
            .and(
                pmatch( fstOut.datum )
                .onInlineDatum(({ datum }) => punsafeConvertType( datum, FreezeableAccount.type ).eq(
                    FreezeableAccount.Account({
                        amount: pDataI( 0 ),
                        currencySym: pBSToData.$( ownPolicy ),
                        credentials: chosenInput.address.credential as any,
                        state: FreezeableAccountState.Ok({})
                    })
                ))
                ._(_ => perror( bool )) as Term<PBool>
            );
            
            return onlyOneInput
            .and( inputHasNoOwnTokens )
            .and( correctMint )
            .and( correctOutput )
        })
    );
});