import { PValidatorHash, Script, compile } from "@harmoniclabs/plu-ts"
import { accountManager } from "../accountManager"
import { writeFile } from "fs/promises";
import { accoutnFactoryPath, accoutnManagerPath } from "./consts";
import { accountFactory } from "../accountFactory";


void async function compileCotnracts()
{
    console.log("compiling accountManager; this might take a few minutes");
    console.time("accountManager");
    const managerBytes = compile( accountManager, [1,0,0] );
    console.timeEnd("accountManager");

    await writeFile( accoutnManagerPath, managerBytes );

    const script = new Script( "PlutusScriptV2", managerBytes );
        
    console.time("factory");
    const factoryBytes = compile(
        accountFactory.$( PValidatorHash.from( script.hash.toBuffer() ) ),
        [1,0,0]
    );
    console.timeEnd("factory");


    await writeFile( accoutnFactoryPath, factoryBytes );
}()