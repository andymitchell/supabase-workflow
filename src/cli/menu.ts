import { IUserInput, fileIoSyncNode, getPackageDirectorySync } from "@andyrmitchell/file-io";
import { executeBuildscript } from "./executeBuildscript";
import { GUIDE_DIR, setup } from "./setup";


export async function menu(userInput:IUserInput):Promise<void> {
    
    const ACTION_BUILDSCRIPT = "action:buildscript";
    const ACTION_PROJECT = "action:project";
    const CHOOSE_ACTION_MESSAGE = `Choose an action...`;

    console.log("\n\n");
    

    const chosen = await userInput.ask({
        name: 'area',
        type: 'rawlist',
        message: "Supabase Workflow Helper",
        choices: [
            {
                type: 'choice',
                name: `Supabase Local >`,
                next: {
                    type: 'rawlist',
                    name: ACTION_BUILDSCRIPT,
                    message: CHOOSE_ACTION_MESSAGE,
                    choices: [
                        {
                            type: 'choice',
                            name: `Run Edge Functions`,
                            meta: 'supabase/start_local_functions.sh'
                        },
                        {
                            type: 'choice',
                            name: `Reset DB`,
                            meta: 'supabase/local_db_reset.sh'
                        },
                        {
                            type: 'choice',
                            name: `Migrate DB (apply local changes)`,
                            meta: 'supabase/local_db_migrate.sh'
                        },
                        {
                            type: 'choice',
                            name: `Test Functions`,
                            meta: 'supabase/test_functions.sh'
                        },
                        {
                            type: 'choice',
                            name: `Test DB`,
                            meta: 'supabase/test_db.sh'
                        },
                        {
                            type: 'choice',
                            name: `Restart Supabase`,
                            meta: 'supabase/restart.sh'
                        }
                    ]
                }
            },
            {
                type: 'choice',
                name: `Git >`,
                next: {
                    type: 'rawlist',
                    name: ACTION_BUILDSCRIPT,
                    message: CHOOSE_ACTION_MESSAGE,
                    choices: [
                        {
                            type: 'choice',
                            name: `Create Feature`,
                            meta: 'git/feature_create.sh'
                        },
                        {
                            type: 'choice',
                            name: `Complete Feature: PR into Develop`,
                            meta: 'git/feature_pr_into_develop.sh'
                        },
                        {
                            type: 'choice',
                            name: `Delete Feature`,
                            meta: 'git/feature_delete.sh'
                        },
                    ]
                }
            },
            {
                type: 'choice',
                name: `Project >`,
                next: {
                    type: 'rawlist',
                    name: ACTION_PROJECT,
                    message: CHOOSE_ACTION_MESSAGE,
                    choices: [
                        {
                            type: 'choice',
                            name: `Run or rerun setup`,
                            meta: 'setup'
                        },
                        {
                            type: 'choice',
                            name: `Open the guide`,
                            meta: 'open_guide_os'
                        },
                        {
                            type: 'choice',
                            name: `Open in VSCode`,
                            meta: 'open_guide_vscode'
                        },
                    ]
                }
            }
        ],
        
    })
    console.log(chosen);

    if( chosen.name===ACTION_BUILDSCRIPT ) {
        let result:string;
        if( typeof chosen.meta==='string' ) {
            console.log(`Executing: ${chosen.meta}`);
            result = await executeBuildscript(chosen.meta);
        } else {
            throw new Error("Need a file URI on the answer");
        }
        console.log(result);
    } else if( chosen.name===ACTION_PROJECT ) {
        if( chosen.meta==='setup' ) {
            setup(userInput);
        } else if( typeof chosen.meta==='string' && chosen.meta.indexOf('open_guide')===0 ) {
            // Get the path to the package this is installed into (instead of this package):
            const consumerPackageDirectory = getPackageDirectorySync(fileIoSyncNode.directory_name(getPackageDirectorySync()))
            const installedGuideDirectory = `${consumerPackageDirectory}/${GUIDE_DIR}`;

            let dir:string;
            if( fileIoSyncNode.has_directory(installedGuideDirectory) ) {
                dir = installedGuideDirectory;
            } else {
                dir = `${getPackageDirectorySync()}/assets/${GUIDE_DIR}`;
            }
            if( chosen.meta==='open_guide_os' ) {
                fileIoSyncNode.execute(`open "${dir}"`);
            } else {
                fileIoSyncNode.execute(`code --reuse-window "${dir}/README_WF_WORKFLOW.MD"`);
            }
        }
    } 
    
    
}