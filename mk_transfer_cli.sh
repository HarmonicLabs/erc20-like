#!/bin/bash

CARDANO_NODE_SOCKET_PATH=/home/michele/cardano/preview/db/node.socket

cardano-cli transaction build \
    --$preview \
    --tx-in f580dbdec86a80795d89c7201b7536eeee9d0507621791fc17b98ef8d6aa3a14#0 \
    --tx-in-script-file ./accountManager.plutus.json \
    --tx-in-inline-datum-present \
    --tx-in-redeemer-cbor-file ./transfer_rdmr.cbor \
    --tx-in b53d95457ac6e36f06a26a9cf26890203e103a94951d34ff54505e570ad8e889#0 \
    --tx-in-script-file ./accountManager.plutus.json \
    --tx-in-inline-datum-present \
    --tx-in-redeemer-cbor-file ./rcv_rdmr.cbor \
    --tx-in f580dbdec86a80795d89c7201b7536eeee9d0507621791fc17b98ef8d6aa3a14#1 \
    --required-signer-hash a218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5 \
    --tx-in-collateral f580dbdec86a80795d89c7201b7536eeee9d0507621791fc17b98ef8d6aa3a14#1 \
    --tx-out addr_test1wqm0q0mgfdjx8yecesppd9ucpmyl4wmppquvpxvkxnjl5xqxtfasd+5000000+"1 764e65a3dee6b22e1de5e2f55f5ff60151d8d0344d84b706e85e1fd3.3172663af9f27e6ec1e315668f0423f194c34d045b221a79390a6f70a9f75d65" \
    --tx-out-inline-datum-cbor-file ./senderOutDat.cbor \
    --tx-out addr_test1wqm0q0mgfdjx8yecesppd9ucpmyl4wmppquvpxvkxnjl5xqxtfasd+5000000+"1 764e65a3dee6b22e1de5e2f55f5ff60151d8d0344d84b706e85e1fd3.9c25c4e852cfc09e6d0d1dcacd7bee047110531f5f90bdd09ede0ba36716f47d" \
    --tx-out-inline-datum-cbor-file ./receiverOutDat.cbor \
    --change-address addr_test1vz3p3f3v2ssg33n3fq72k8rfh7qv3gyldsth0evqdwadmfg8cxmaf \
    --out-file tx.cli.json

#const cmd = `cardano-cli transaction build \
#    --$preview \
#    --tx-in ${myAccountUtxo.utxoRef.toString()} \
#    --tx-in-script-file ./accountManager.plutus.json \
#    --tx-in-inline-datum-present \
#    --tx-in-redeemer-cbor-file ./transfer_rdmr.cbor \
#    --tx-in ${sndAccountUtxo.utxoRef.toString()} \
#    --tx-in-script-file ./accountManager.plutus.json \
#    --tx-in-inline-datum-present \
#    --tx-in-redeemer-cbor-file ./rcv_rdmr.cbor \
#    --tx-in ${utxo.utxoRef.toString()} \
#    --required-signer-hash ${fstAddr.paymentCreds.hash.toString()} \
#    --tx-in-collateral ${utxo.utxoRef.toString()} \
#    --tx-out ${accountManagerAddr}${myAccountUtxo.resolved.value.toString()} \
#    --tx-out-inline-datum-cbor-file ./senderOutDat.cbor \
#    --tx-out ${accountManagerAddr}${sndAccountUtxo.resolved.value.toString()} \
#    --tx-out-inline-datum-cbor-file ./receiverOutDat.cbor \
#    --change-address ${fstAddr.toString()} \
#    --out-file tx.cli.json
#    `;
#
#    console.log( cmd + "\n" );
#
#    const cliRes = execSync( cmd,
#        {
#            encoding: "utf-8",
#            env: {
#                CARDANO_NODE_SOCKET_PATH:"/home/michele/cardano/preview/db/node.socket"
#            }
#        }
#    );
#
#    console.log( cliRes );
#    return;

#const tx = Tx.fromCbor(
#        "84a800838258209b2c385722216ccd9fb9b58161be3d06d12ce7d875f67c436add93c3f3f7c6a300825820bda35772b6607aa0aad4f74fa90feabbe48874e76447a7c14c2262f13c586de700825820bda35772b6607aa0aad4f74fa90feabbe48874e76447a7c14c2262f13c586de7010d81825820bda35772b6607aa0aad4f74fa90feabbe48874e76447a7c14c2262f13c586de7010183a300581d7047cca9ccc96241fb15616375fcad13150d0ee89e15a33e540ef6359f01821a004c4b40a1581c18f15b916f2e279946131e6395d2d43b5d21a18ed3139f3b14e95626a15820142bfa026474aa044296e5626a41cb0fcc304a1d649d33a8280bf883481bf65801028201d818584ad8799f1926acd8799f581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5ff581c18f15b916f2e279946131e6395d2d43b5d21a18ed3139f3b14e95626d87980ffa300581d7047cca9ccc96241fb15616375fcad13150d0ee89e15a33e540ef6359f01821a004c4b40a1581c18f15b916f2e279946131e6395d2d43b5d21a18ed3139f3b14e95626a15820922f5a5194224cea905df2af124895d4f5b914718fff2f5f623df15215a9e52601028201d8185849d8799f1864d8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff581c18f15b916f2e279946131e6395d2d43b5d21a18ed3139f3b14e95626d87980ffa200581d60a218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5011b0000000251b89ddd10a200581d60a218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda5011b0000000251b45e0a111a000cbf78021a00087fa50e81581ca218a62c542088c671483cab1c69bf80c8a09f6c1777e5806bbadda50b5820f2c7254519155856e5df590160b94492551997ba2e67412d3758c5d0221fdf7ca20681590a1e590a1b010000323232323232323232323232323232323232323232323232323232323232322223232323232323232323232323232323232323232323232533357340022930b19999981c00c1191919191981e1981e1981e1981e1981e1981e1aba33574400626ae8cd5d100209aba33303701800d13303c3370e0189001099b8700b480084cdc399981b1bab303500201900e480084cc0f0cc0f0cdc38049bad35742002266ebc068c0d40044cdc780c9bae303400113375e60660026ae84014c0c4c8cccc0c4c0d00088d5d08008008009318181aba10023302c0040113302b00400226232323303a3303a3303a3370e6058002900209981d19b8700a480084cdc3804a4004266054466e1d2002333035375660686062002030012004266605266644607644a666ae68d5d180088160992999ab9a300400113374a900019aba0300500103313003357440046ae840048dd399aba035573a00266ae80d55cf000817919199998149aab9d0020010012323375e6ae84008d5d0981a2999ab9a3375e6ae84c0d00040604d5d09aba20051001357420080024940dd5991aba1357446ae88d5d11aba2357446ae88d5d11aba2357440020264c46466666607a6aae78c0a0d5d080100080080091981e99b8848000dd6981b000899baf357420020360024c6605800802266056008004464646464646464646464660846608466084660846608466084660846608466084660846605a292010d6f6e6c7954776f4f776e496e73003370e606801290020998168a490e6f6e6c7954776f4f776e4f757473003370e606801490020998168a491473656e646572486173456e6f75676856616c7565003371200201e26605a292010d6e6f4e65774163636f756e747300357466607a03c02626605a29210d73656e646572497356616c696400330423370e0249001099b87011480084cc0b4524011073656e6465724f7574497356616c6964003370e6660786eacc0ecc0e0d5d0a999ab9a3370e6600e03e02890010805099aba000633574001006c03e02890010998168a4810f70726573657276656453656e646572003302c3027024302700513302d14901117072657365727665645265636569766572003302c00200413302d149010f636f72726563745472616e7366657200330423370e6eb4d5d0981c00299b8100f00113370e6eb4d5d0981c00219b80375a6ae84c0e00080044cc0b4524010c73656e6465725369676e65640033303102023303323330333574260746ae84c0e8c0f4c0e80048cdc79bae357420026eb8d5d0801925001b233322233036300300100271e664664608246ae80c0080040052f588eb8dd6191aba1357446ae88d5d11aba2357446ae88d5d11aba200101c375c6ae840044cc0b4524010666726f7a656e003370e6aae74dd5181c810a40006eb4c0e8028c090c0e4c0d94ccd5cd19baf35742606c00203426ae84d5d100388009aba10063022357426ae894ccd5cd19b873300301b0104800840184cd5d000119aba0004032302135742a666ae68cdc39980100d007a4004200a266ae80004cd5d00018189aba135744008606a6eacc0d0c0c4004d5d0801198160020089981580200111919191981d9981d9981d9981d9981d9aba33574400426ae8ccc0d805c0304cc0eccdc3805a4004266e1c02920021357466ae8800c4cdc4a400000226464646607c6607c6607c66e1cc0c000920021323303f3371e6eb8d55ce800806899b87375a6aae7800520023574200426644646466084660846605a2921056372656473003375e6076004607600226605a29201076375727253796d003371e6eb8c0e8008dd7181d0008998168a49057374617465003375e60720046072002606e004606c004040002266e1cdd69aba1303400100432333303330360032357420020020024c60226eacc0d4004c0c4d5d080199b80007375a6ae8400ccc0b0010044cc0ac010008dd618170079180118179816000991191981b99baf35742605a6ae8400400c4cc09c8cdc79bae35573a00202a6eacc0c0004c0b0004d5d098151aba100b375a6ae84048dd71aab9d357426466604466644606844a666ae68d5d180088128992999ab9a300400113374a900019aba0300500102c13003357440046ae8400405803c024988dd59aab9e3020357420020106eb4d55cf00218110021bab32357426ae88d5d11aba2357440020106eb8d55ce8009aba10013001002233301b33322302d22533357346ae8c00440784c94ccd5cd1802000899ba548000cd5d01802800812898019aba20023574200201e0100044c46eacd55cf180c9aba100137566046002603e66603066644605444a666ae68d5d1800880d8992999ab9a300400113374a900019aba0300500102213003357440046ae8400480048cdd79aba1302000100400126230233020357420026eb0d5d0800980e9aba1002323333301430200020010012357420020024c603600a466e3cdd71aab9d001002375c60360046036002602e00646e9ccd5d01aab9d0013357406aae780040488c8cccc04cc058c0500088d5d080080080093119ab9c37326460066ecc0040040048cc068894ccd5cd19b89371a0060022910100133714600866e3800c004c008cdc0000a40049000119b8a3002337060029010180119b860014808094ccd5cd19b88001480504c0080044cdc599b80001482b8052210023371666e0000520604881002232323301a3301a3300514901056372656473003375e6026004602600226600a29201076375727253796d003371e6eb8c048008dd718090008998028a49057374617465003375e60220046022002601e004601c00444a666ae68004528899ab9c50024a046466ec0d5d08009aba1357440026eb000488888c8cc94ccd5cd1800a400020062a666ae68c005200210041533357346002900208028a999ab9a300148018401858dc39aab9d00135573c0026ea8015300103d87a800022232332533357346002900008018a999ab9a300148008401058dc39aab9d00135573c0026ea800c8cc038852811119802980200109801800912999ab9a00214a20026601642900011119b8048008c00c0048cc028894ccd5cd1801801099aba000200110010023762931111191992999ab9a300148000400c54ccd5cd1800a400420082a666ae68c0052004100516370e6aae74004d55cf0009baa004235573c6ea80048d5d09aba2357446ae880048d5d09aba23574400246ae84d5d100091119980310a4000444a666ae68cdc7991bae35573a00200400a26660124290001112999ab9a3371e6eb8d55ce80100389bad35573c004260060026eacd55cf00109801800801919801112999ab9a3003002133574000400220026ec9262233003210022223300500230030013002222232333006300400130030010023300400300222253335573e0020062660046ae84004d5d1000919180111980100100091801119801001000912999ab9a00200114a044444464664a666ae68c005200010031533357346002900108020a999ab9a300148010401454ccd5cd1800a400c200c2a666ae68c0052008100716370e6aae74004d55cf0009baa006010582840000d87b80821a00070e0e1a0952e537840001d87a9fd8799f581c9be739f23290da863631a61b5a4932212ecbae8a5fd8cf0ea59b4889ff1864ff821a0021c9851a3d90aa0ff5f6"
#    );
#
#    tx.signWith( prvt );
#
#    await blockfrost.submitTx( tx );
#
#    console.log( tx.hash.toString() );
#    return;