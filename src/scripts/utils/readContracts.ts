import { Script } from "@harmoniclabs/plu-ts";
import { readFile } from "fs/promises";
import { accoutnFactoryPath, accoutnManagerPath } from "../consts";

export async function readContracts(): Promise<{
    accountManager: Script<"PlutusScriptV2">,
    accountFactory: Script<"PlutusScriptV2">
}>
{
    const managerByets = await readFile( accoutnManagerPath );
    const factoryByets = await readFile( accoutnFactoryPath );

    return {
        accountManager: new Script( "PlutusScriptV2", managerByets ),
        accountFactory: new Script( "PlutusScriptV2", factoryByets )
    };
}