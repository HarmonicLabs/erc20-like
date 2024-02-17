import { readContracts } from "./utils/readContracts"

void async function main()
{
    const { accountFactory, accountManager } = await readContracts();
    
    console.log( "accountFactory", accountFactory.hash.toString() ,JSON.stringify( accountFactory.toJson(), undefined, 2 ) );
    console.log( "accountManager", accountManager.hash.toString() ,JSON.stringify( accountManager.toJson(), undefined, 2 ) );
}()