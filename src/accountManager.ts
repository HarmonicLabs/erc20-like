import { PAssetsEntry, PCredential, PScriptContext, PTxInInfo, PTxOut, PTxOutRef, PValue, PValueEntry, TermBool, bool, delayed, int, list, pBool, pList, pStr, pand, pdelay, peqInt, perror, pfn, phoist, pif, pisEmpty, plet, pmatch, pstruct, ptrace, ptraceBs, ptraceData, ptraceIfFalse, ptraceInt, punsafeConvertType, unit } from "@harmoniclabs/plu-ts";
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

    // the compiler was automatically hoisting the "tail" and "head"
    // since some redeemers only require a single input or output
    // and others require 2
    // it was causing calling 2 times `tail` or `tail.head` on single element lists
    // failing the contract
    // this is an easy fix, but I'm lazy so for now we'll let manually in each redeemer

    // inlined in each redeemer that needs it
    const _ownOuts = tx.outputs.filter( isOwnOutput );
    // inlined in each redeemer that needs it
    const _ownIns = tx.inputs.filter( isOwnInput );

    const isOwnAssetEntry = plet(
        pfn([ PValueEntry.type ], bool)
        (({ fst: policy }) => policy.eq( account.currencySym ))
    );

    const preservedAccount = plet(
        pfn([ FreezeableAccount.type, FreezeableAccount.type ], bool )
        (( inAccount, outAccount ) => {

            return ptraceIfFalse.$(pdelay(pStr("creds"))).$( inAccount.credentials.eq( outAccount.credentials ) )
            .and(  ptraceIfFalse.$(pdelay(pStr("currSym"))).$( inAccount.currencySym.eq( outAccount.currencySym ) ) )
            // checking the state to be equal is needed for
            // easier inidpendent offchain implementation (wallets)
            .and(  ptraceIfFalse.$(pdelay(pStr("state"))).$( inAccount.state.eq( outAccount.state ) ) );
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
        .onNewState(({ next }) =>
        plet( _ownOuts ).in( ownOuts =>
        plet( _ownIns ).in( ownIns => {

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
                ownAssets.length.eq( 1 )
                // quantity is 1
                .and( ownAsset.snd.eq( 1 ) );

            const isValidOutAccount = peqInt.$(
                ownOut.value.amountOf( account.currencySym, ownAssetName )
            ).$( 1 );

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
            // prevents DoS due to token spam
            .and( outValueLenIs2.$( ownOut ) )
            .and( noAccountsCreated )
            .and( isValidAccount )
            .and( isValidOutAccount )
            .and( preservedAccountInfos )
            .and( stateUpdated )
        })))
        .onMint( mint =>
        plet( _ownOuts ).in( ownOuts =>
        plet( _ownIns ).in( ownIns => {

            const singleOwnIn = pisEmpty.$( ownIns.tail );

            const noAccountsCreated = pisEmpty.$(
                tx.mint.filter( isOwnAssetEntry )
            );

            const ownAssets = plet( getOwnAssets.$( ownValue ) );
            const ownAsset = plet( ownAssets.head );
            const isValidAccount =
                // single asset of policy
                ownAssets.length.eq( 1 )
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

                return nextAssets.length.eq( 1 )
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

            return (
                singleOwnIn
                .and(  noAccountsCreated )
                .and(  isValidAccount )
                .and(  singleOutToSelf )
                // prevents DoS due to token spam
                .and(  outValueLenIs2.$( ownOut ) )
                .and(  nonNegativeOutAmt )
                .and(  correctOwnOut )
            );
        })))
        // essentially forwards to Transfer (checks that the other input is spent with transfer)
        .onReceive( _ =>
            plet( _ownOuts ).in( ownOuts =>
            plet( _ownIns ).in( ownIns => {
            
            const onlyTwoOwnIns = ownIns.length.eq( 2 );

            const receiverIn = validatingInput;
            const receiverInRef = ownUtxoRef;
            const receiverValue = ownValue;
            
            const receiverAssets = plet( getOwnAssets.$( receiverValue ) );
            const receiverAsset = plet( receiverAssets.head );
            const receiverIsValid =
                // single asset of policy
                receiverAssets.length.eq( 1 )
                // quantity is 1
                .and( receiverAsset.snd.eq( 1 ) );

            const receiverName = receiverAsset.fst;
            const receiverTokenPreserved =  ownOuts.some(
                out =>
                    peqInt.$(1)
                    .$( out.value.amountOf( account.currencySym, receiverName ) )
            )

            const fstOwnIn = plet( ownIns.head );
            const sndOwnIn = plet( ownIns.tail.head );

            const { utxoRef: senderInRef, resolved: senderIn } = plet(
                pif( PTxInInfo.type )
                .$( fstOwnIn.utxoRef.eq( receiverInRef ) )
                .then( sndOwnIn )
                .else( fstOwnIn )
            );

            // inlined
            // if this is true the transfer of value is checked in the transfer redeemer
            const correctSenderTransfer =
                tx.redeemers.some(({ fst: purpose, snd: _senderRdmr }) =>
                    pand
                    .$(
                        pmatch( purpose )
                        .onSpending(({ utxoRef }) => utxoRef.eq( senderInRef ) )
                        ._( _ => pBool( false ) )
                    ).$(
                        pdelay(
                            pmatch( punsafeConvertType( _senderRdmr, AccountManagerRdmr.type ) )
                            .onTransfer(({ amount, to }) => amount.gt( 0 ))
                            // sender redeemer is not transfer
                            ._( _ => perror( bool ) )
                        )
                    )
                );

            return onlyTwoOwnIns
            .and(  receiverIsValid )
            .and(  receiverTokenPreserved )
            .and(  correctSenderTransfer );
            // DoS by token spam checked in `Transfer`
        })))
        .onTransfer(({ to, amount }) =>
        plet( _ownOuts ).in( ownOuts =>
        plet( _ownIns ).in( ownIns => {
            
            const onlyTwoOwnIns = ownIns.length.eq( 2 );
            const onlyTwoOwnOuts = ownOuts.length.eq( 2 );
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

            const otherInIsRecv = ptrace( bool ).$("")
            .$(
                tx.redeemers.some(({ fst: purpose, snd: rdmr }) =>
                    pand
                    .$(
                        pmatch( purpose )
                        .onSpending(({ utxoRef }) => utxoRef.eq( receiverInRef ) )
                        ._(_ => pBool( false ) )
                    )
                    .$(
                        pdelay(
                            pmatch( punsafeConvertType( rdmr, AccountManagerRdmr.type ) )
                            .onReceive( _ => pBool( true ) )
                            ._( _ => pBool( false ) )
                        )
                    )
                )
            );

            const senderAssets = plet( getOwnAssets.$( senderValue ) );
            const senderAsset = plet( senderAssets.head );
            const senderIsValid =
                // single asset of policy
                senderAssets.length.eq( 1 )
                // quantity is 1
                .and( senderAsset.snd.eq( 1 ) );
            const senderName = senderAsset.fst;

            const receiverAssets = plet( getOwnAssets.$( receiverIn.value ) )
            const receiverAsset = receiverAssets.head;
            const receiverIsValid = 
                // single asset of policy
                receiverAssets.length.eq( 1 )
                // quantity is 1
                .and( receiverAsset.snd.eq( 1 ) );
            const receiverName = receiverAsset.fst;

            const sortedOuts = plet(
                pif( list( PTxOut.type ) )
                .$(
                    peqInt.$(
                        ownOuts.head.value.amountOf( account.currencySym, senderName )
                    ).$( 1 )
                )
                .then( ownOuts )
                .else(
                    pList( PTxOut.type )
                    // ownOuts.reversed; but more efficient
                    ([ ownOuts.tail.head, ownOuts.head ])
                )
            );

            const senderOut = plet( sortedOuts.head );
            const receiverOut = plet( sortedOuts.tail.head );

            const senderOutIsValid = peqInt.$(
                senderOut.value.amountOf( account.currencySym, senderName )
            ).$( 1 );

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

            // inlined
            // we check that the credentials passed via transfer redeemer
            // match the credentials present in the input with `Receive`
            const isIntendedReceiver = to.eq( receiverInAccount.credentials );

            // cardano node CEK machine wants the `trace` here or else gets mad
            // both akien and plu-ts machines give no problems without the trace
            // but the node doesn't like it
            const preservedSender = preservedAccount
            .$( ptrace( FreezeableAccount.type ).$("").$( account ) )
            .$( ptrace( FreezeableAccount.type ).$("").$( senderOutAccount ) );

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

            // inlined
            const senderNotFrozen = account.state.raw.index.eq( 0 ); // FreezeableAccountState.Ok({})

            // receiverIsValid checked in "Receive" redeemer
            // receiverOutIsValid checked in "Receive" redeemer
            return onlyTwoOwnIns
            .and( onlyTwoOwnOuts )
            // prevents DoS by token spam
            .and( ownOuts.every( outValueLenIs2 ) )
            .and( otherInIsRecv )
            .and( senderHasEnoughValue )
            .and( noNewAccounts )
            .and( senderIsValid )
            .and( senderOutIsValid )
            .and( isIntendedReceiver )
            .and( preservedSender )
            .and( preservedReceiver )
            .and( correctTransfer )
            .and( senderSigned )
            .and( ptraceIfFalse.$(pdelay(pStr("frozen"))).$( senderNotFrozen ) );
        })))
    )
});

const outValueLenIs2 = phoist(
    pfn([ PTxOut.type ], bool )
    ( out => out.value.length.eq(2) )
);