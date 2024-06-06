#!/usr/bin/env node

import { UserInputNode } from "@andyrmitchell/file-io";
import { menu } from "./menu";

async function main() {

    
    const userInput = new UserInputNode();
    await menu(userInput);

    userInput.close();

}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});