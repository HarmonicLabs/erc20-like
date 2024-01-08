import { PAssetsEntry, PCredential, PScriptContext, PTokenName, PTxInInfo, PTxOut, PTxOutRef, PValue, bool, int, list, pBool, pList, perror, pfn, phoist, pif, pisEmpty, plet, pmatch, pnilData, pstruct, punsafeConvertType, unit } from "@harmoniclabs/plu-ts";
import { FreezeableAccount, FreezeableAccountState } from "./types/Account";
import { passert } from "./passert";

export const AccountManagerRdmr = pstruct({
    Mint: { // or Burn if `amount` is negative
        amount: int
    },
    Transfer: {
        to: PCredential.type,
        amount: int
    },
    Receive: {},
    ForwardCompatibility: {},
    // non standard redeemers (meant for state modification)
    NewState: {
        next: FreezeableAccountState.type
    }
});

export const accountManager = pfn([
    FreezeableAccount.type,
    AccountManagerRdmr.type,
    PScriptContext.type
],  unit)
(( account, rdmr, { tx, purpose }) => {

    const ownUtxoRef = plet(
        pmatch( purpose )
        .onSpending(({ utxoRef }) => utxoRef )
        ._(_ => perror( PTxOutRef.type ) )
    );

    const validatingInput = plet(
        pmatch(
            tx.inputs.find( i => i.utxoRef.eq( ownUtxoRef ) )
        )
        .onJust(({ val }) => val.resolved )
        .onNothing(_ => perror( PTxOut.type ) )
    );

    const ownValue = validatingInput.value ;
    
    const isOwnOutput = plet(
        plet(
            validatingInput.address.credential
        ).in( ownCreds => 
            pfn([ PTxOut.type ], bool )
            ( out => 
                out.address.credential.eq( ownCreds )
                // a single account manager contract might handle multiple tokens
                .and(
                    out.value.some( ({ fst: policy }) => policy.eq( account.currencySym ) )
                ) 
            )
        )
    );

    const isOwnInput = plet(
        pfn([ PTxInInfo.type ], bool )
        ( input => isOwnOutput.$( input.resolved ) )
    );

    const outIncludesNFT = plet(
        plet( account.currencySym.peq )
        .in( isOwnCurrSym => 
            pfn([ PTxOut.type ], bool )
            ( out => out.value.some( entry => isOwnCurrSym.$( entry.fst ) ) )
        )
    );

    const ownOuts = plet( tx.outputs.filter( isOwnOutput ) );
    const ownIns = plet( tx.inputs.filter( isOwnInput ) );

    const isOwnAssetEntry = plet(
        pfn([ PAssetsEntry.type ], bool)
        (({ fst: policy }) => policy.eq( account.currencySym ))
    );

    const preservedAccount = plet(
        pfn([ FreezeableAccount.type, FreezeableAccount.type ], bool )
        (( inAccount, outAccount ) => {

            return inAccount.credentials.eq( outAccount.credentials )
            .and(  inAccount.currencySym.eq( outAccount.currencySym ) )
            // checking the state to be equal is needed for
            // easier inidpendent offchain implementation (wallets)
            .and(  inAccount.state.eq( outAccount.state ) )
        })
    );

    const getOwnAssets = plet(
        pfn([ PValue.type ], list( PAssetsEntry.type ))
        ( value => 
            pmatch( ownValue.find( isOwnAssetEntry ) )
            .onJust(({ val }) => val.snd )
            .onNothing( _ => perror( list( PAssetsEntry.type ) ) )
        )
    )

    return passert.$(
        pmatch( rdmr )
        .onForwardCompatibility( _ => perror( bool ) )
        .onNewState(({ next }) => {

            const singleOwnIn = pisEmpty.$( ownIns.tail );
            const singleOwnOut = pisEmpty.$( ownOuts.tail );
            const ownIn = validatingInput;
            const ownOut = plet( ownOuts.head );

            const noAccountsCreated = pisEmpty.$(
                tx.mint.filter( isOwnAssetEntry )
            );

            const ownAssets = plet( getOwnAssets.$( ownValue ) );

            const ownAsset = plet( ownAssets.head );

            const ownAssetName = plet( ownAsset.fst );

            const isValidAccount =
                // single asset of policy
                pisEmpty.$( ownAssets.tail )
                // quantity is 1
                .and( ownAsset.snd.eq( 1 ) );

            const isValidOutAccount = ownOut.value.amountOf( account.currencySym, ownAssetName ).eq( 1 );

            const inAccount = account;
            const outAccount = plet(
                pmatch( ownOut.datum )
                .onInlineDatum(({ datum }) => punsafeConvertType( datum, FreezeableAccount.type ) )
                ._(_ => perror( FreezeableAccount.type ))
            );

            const preservedAccountInfos = inAccount.amount.eq( outAccount.amount )
            .and( inAccount.credentials.eq( outAccount.credentials ) )
            .and( inAccount.currencySym.eq( outAccount.currencySym ) );

            const stateUpdated = outAccount.state.eq( next );

            return singleOwnIn
            .and( singleOwnOut )
            .and( noAccountsCreated )
            .and( isValidAccount )
            .and( isValidOutAccount )
            .and( preservedAccountInfos )
            .and( stateUpdated )
        })
        .onMint( mint => {

            const singleOwnIn = pisEmpty.$( ownIns.tail );

            const noAccountsCreated = pisEmpty.$(
                tx.mint.filter( isOwnAssetEntry )
            );

            const ownAssets = plet( getOwnAssets.$( ownValue ) );

            const ownAsset = plet( ownAssets.head );

            const isValidAccount =
                // single asset of policy
                pisEmpty.$( ownAssets.tail )
                // quantity is 1
                .and( ownAsset.snd.eq( 1 ) );

            const ownAssetName = ownAsset.fst;

            const singleOutToSelf = pisEmpty.$( ownOuts.tail );
            const ownOut = plet( ownOuts.head );

            const expectedOutAmt = plet( account.amount.add( mint.amount ) );

            const nonNegativeOutAmt = expectedOutAmt.gtEq( 0 );

            const correctOwnOut = plet(
                getOwnAssets.$( ownOut.value )
            ).in( nextAssets => {

                const nextAsset = nextAssets.head;

                const nextAccount = plet(
                    pmatch( ownOut.datum )
                    .onInlineDatum(({ datum }) => punsafeConvertType( datum, FreezeableAccount.type ) )
                    ._( _ => perror( FreezeableAccount.type ) )   
                );

                return pisEmpty.$( nextAssets.tail )
                .and(
                    // preserve nft
                    nextAsset.fst.eq( ownAssetName )
                    .and( nextAsset.snd.eq( 1 ) )
                )
                .and(
                    preservedAccount
                    .$( account )
                    .$( nextAccount )
                )
                .and( nextAccount.amount.eq( expectedOutAmt ) )
            });

            return singleOwnIn
            .and(  noAccountsCreated )
            .and(  isValidAccount )
            .and(  singleOutToSelf )
            .and(  nonNegativeOutAmt )
            .and(  correctOwnOut );
        })
        // essentially forwards to Transfer (checks that the other input is spent with transfer)
        .onReceive( _ => {
            
            const onlyTwoOwnIns = pisEmpty.$( ownIns.tail.tail );

            const receiverIn = validatingInput;
            const receiverInRef = ownUtxoRef;
            const receiverValue = ownValue;
            
            const fstOwnIn = plet( ownIns.head );
            const sndOwnIn = plet( ownIns.tail.head );

            const { utxoRef: senderInRef, resolved: senderIn } = plet(
                pif( PTxInInfo.type )
                .$( fstOwnIn.utxoRef.eq( receiverInRef ) )
                .then( sndOwnIn )
                .else( fstOwnIn )
            );

            // if this is true the transfer of value is checked in the transfer redeemer
            const correctSenderTransfer = plet(
                pmatch(
                    tx.redeemers.find(({ fst: purpose }) =>
                        pmatch( purpose )
                        .onSpending(({ utxoRef }) => utxoRef.eq( senderInRef ) )
                        ._( _ => pBool( false ) )
                    )
                )
                .onJust(({ val: { snd: _senderRdmr } }) => {
                    const senderRdmr = punsafeConvertType( _senderRdmr, AccountManagerRdmr.type )
                    
                    return pmatch( senderRdmr )
                    .onTransfer(({ to, amount }) => {

                        return amount.gt( 0 )
                        .and( to.eq( receiverIn.address.credential ) )
                    })
                    // sender redeemer is not transfer
                    ._( _ => perror( bool ) )
                })
                // sender redeemer not found
                .onNothing( _ => perror( bool ) )
            );

            return onlyTwoOwnIns
            .and(  correctSenderTransfer );
        })
        .onTransfer(({ to, amount }) => {
            
            const onlyTwoOwnIns = pisEmpty.$( ownIns.tail.tail );
            const onlyTwoOwnOuts = pisEmpty.$( ownOuts.tail.tail );
            const senderHasEnoughValue = account.amount.gtEq( amount );
            const noNewAccounts = pisEmpty.$( tx.mint.filter( isOwnAssetEntry ) );

            const senderIn = validatingInput;
            const senderInRef = ownUtxoRef;
            const senderValue = ownValue;
            
            const fstOwnIn = ownIns.head;
            const sndOwnIn = ownIns.tail.head;

            const { utxoRef: receiverInRef, resolved: receiverIn } = plet(
                pif( PTxInInfo.type )
                .$( fstOwnIn.utxoRef.eq( senderInRef ) )
                .then( sndOwnIn )
                .else( fstOwnIn )
            );

            const senderAssets = plet( getOwnAssets.$( senderValue ) );
            const senderAsset = plet( senderAssets.head );
            const senderIsValid =
                // single asset of policy
                pisEmpty.$( senderAssets.tail )
                // quantity is 1
                .and( senderAsset.snd.eq( 1 ) );
            const senderName = senderAsset.fst;

            const receiverAssets = plet( getOwnAssets.$( receiverIn.value ) )
            const receiverAsset = receiverAssets.head;
            const receiverIsValid = 
                // single asset of policy
                pisEmpty.$( receiverAssets.tail )
                // quantity is 1
                .and( receiverAsset.snd.eq( 1 ) );
            const receiverName = receiverAsset.fst;

            const mkPListTxOut = pList( PTxOut.type );

            const fstOwnOut = plet( ownOuts.head );
            const sndOwnOut = plet( ownOuts.tail.head );

            const sortedOuts = plet(
                pif( list( PTxOut.type ) )
                .$( fstOwnOut.value.amountOf( account.currencySym, senderName ).eq( 1 ) )
                .then( mkPListTxOut([ fstOwnOut, sndOwnOut ]) )
                .else( mkPListTxOut([ sndOwnOut, fstOwnOut ]) )
            );

            const senderOut = plet( sortedOuts.head );
            const receiverOut = plet( sortedOuts.tail.head );

            const getAccount = phoist(
                pfn([ PTxOut.type ], FreezeableAccount.type )
                ( out => 
                    pmatch( out.datum )
                    .onInlineDatum(({ datum }) => punsafeConvertType( datum, FreezeableAccount.type ) )
                    ._(_ => perror( FreezeableAccount.type ) )
                )
            );

            const senderOutAccount = plet( getAccount.$( senderOut ) );
            const receiverInAccount = plet( getAccount.$( receiverIn ) );
            const receiverOutAccount = plet( getAccount.$( receiverOut ) );

            const preservedSender = preservedAccount.$( account ).$( senderOutAccount );
            const preservedReceiver = preservedAccount.$( receiverInAccount ).$( receiverOutAccount );

            const expectedSenderAmount = account.amount.sub( amount );
            const expectedReceiverAmount = receiverInAccount.amount.add( amount );

            const correctTransfer = senderOutAccount.amount.eq( expectedSenderAmount )
            .and( receiverOutAccount.amount.eq( expectedReceiverAmount ) );

            const senderSigned = pmatch( account.credentials )
            .onPPubKeyCredential(({ pkh }) => tx.signatories.includes( pkh ) )
            .onPScriptCredential(({ valHash }) =>
                tx.inputs.some( i =>
                    pmatch( i.resolved.address.credential )
                    .onPPubKeyCredential( _ => pBool( false ) )
                    .onPScriptCredential(({ valHash: inputHash }) => inputHash.eq( valHash ) )
                )
            );

            const senderNotFrozen = account.state.raw.index.eq( 0 ); // FreezeableAccountState.Ok({})

            return onlyTwoOwnIns
            .and( onlyTwoOwnOuts )
            .and( senderHasEnoughValue )
            .and( noNewAccounts )
            .and( senderIsValid )
            .and( receiverIsValid )
            .and( preservedSender )
            .and( preservedReceiver )
            .and( correctTransfer )
            .and( senderSigned )
            .and( senderNotFrozen )
        })
    )
})