#!/usr/bin/env node

import { UserInputNode } from "@andyrmitchell/file-io";
import { menu } from "./menu";
import { dLog } from "@andyrmitchell/utils";

async function main() {
    const args = process.argv.slice(2); // Get command-line arguments. FYI 0 is node, 1 is the script name. Start after that. 
    const verboseIdx = args.indexOf('--verbose');
    const verbose = verboseIdx>-1;
    if( verbose ) dLog('main', 'running verbose');

    
    const userInput = new UserInputNode();
    await menu(userInput, verbose);

    userInput.close();

}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});