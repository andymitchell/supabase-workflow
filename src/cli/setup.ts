import { IUserInput, backupFileSync, fileIoNode, fileIoSyncNode, getDirectoryFromUser, getPackageDirectorySync, listSubDirectories, readJsonFromFile, readJsonFromFileSync, stripTrailingSlash } from "@andyrmitchell/file-io";
import { CryptoHelpers, sleep } from "@andyrmitchell/utils";
import {isEqual, last, merge} from 'lodash-es';

const LATEST_PACKAGE_ROOT_DIR = `assets/deployable/package-root`;
const GITHUB_SBW_SCRIPTS_DIR = '.github/_sbw_scripts';
const GITHUB_WORKFLOWS_DIR = '.github/workflows';
const GITHUB_HOOKS_DIR = '.github/hooks';
export const GUIDE_DIR = 'supabase-workflow-guide';



export async function setup(userInput:IUserInput, consumerPackageAbsoluteDirectory?:string):Promise<void> {

    if( !consumerPackageAbsoluteDirectory ) {
        consumerPackageAbsoluteDirectory = getPackageDirectorySync(fileIoSyncNode.directory_name(getPackageDirectorySync()))
    }

    await installGithubWorkflows(userInput, consumerPackageAbsoluteDirectory);
    await updateGithubSbwScripts(userInput, consumerPackageAbsoluteDirectory);
    await updateGuide(userInput, consumerPackageAbsoluteDirectory);
    await addGithubPrecommitChecks(userInput, consumerPackageAbsoluteDirectory);
    await updateVsCodeWindowSettingsForDeno(userInput, consumerPackageAbsoluteDirectory);

    console.log("Setup complete OK");

}

async function createHashOfGithubWorkflowFiles(files:string[], absoluteDirectory:string):Promise<{hash: string, any:boolean}> {
    let combined:string = '';
    for( const file of files ) {
        const uri = `${absoluteDirectory}/${file}`;
        const contents = fileIoSyncNode.read(uri);
        if( contents ) combined += contents;
    }

    return {hash: await CryptoHelpers.sha1Hex(combined), any: combined.length>0};
}

async function installGithubWorkflows(userInput:IUserInput, consumerPackageDirectory:string):Promise<void> {
    // Ask if they want to write (or overwrite) <destination-package-root>/${GITHUB_WORKFLOWS_DIR} (if overwriting, clone old file)

    const latestWorkflowsDirectory = `${getPackageDirectorySync()}/${LATEST_PACKAGE_ROOT_DIR}/${GITHUB_WORKFLOWS_DIR}`;
    const installedWorkflowsDirectory = `${consumerPackageDirectory}/${GITHUB_WORKFLOWS_DIR}`;

    const files = ['production.yaml', 'ci.yaml', 'staging.yaml'];
    // Read in the latest versions we have 
    const latestCombined = await createHashOfGithubWorkflowFiles(files, latestWorkflowsDirectory);
    const installedCombined = await createHashOfGithubWorkflowFiles(files, installedWorkflowsDirectory);

    const noChange = latestCombined.hash===installedCombined.hash;
    if( noChange ) return;
    
    console.log("GitHub Workflows trigger actions when you push to 'developer' (staging) or 'main' (production).");
    console.log("(These include telling Supabase to update correctly, and checking GitHub/Supabase have the necessary env vars.)");
    if( installedCombined.any ) {
        console.log("You already have GitHub Workflow files. If you proceed, these will be backed up (so you can manually reconcile them).");
    }
    const responseInstall = await userInput.ask({
        type: 'confirm',
        message: "Install Github Workflow yaml?",
        name: 'github_workflow_install'
    })
    
    if( responseInstall.type!=='confirmation' ) return; // abort

    if( responseInstall.answer ) {
        // Force the scripts
        updateGithubSbwScripts(userInput, consumerPackageDirectory, true);

        // Copy files over (overwrite)
        for( const file of files ) {
            const sourceUri = `${latestWorkflowsDirectory}/${file}`;
            const destinationUri = `${installedWorkflowsDirectory}/${file}`;

            backupFileSync(destinationUri);
            fileIoSyncNode.copy_file(sourceUri, destinationUri, {overwrite: true, make_directory: true});
        }

    } else {
        const responseIgnore = await userInput.ask({
            type: 'confirm',
            message: "Should this setup utility stop asking, until any further changes occur to the available yaml files?",
            name: 'github_workflow_ignore'
        })

        // TODO If yes, store the latestCombined.hash in TypedConfig, to ignore if match. 
    }
    
    
}

async function updateGithubSbwScripts(userInput:IUserInput, consumerPackageDirectory:string, force?: boolean):Promise<void> {
    // Always overwrite <destination-package-root>/${GITHUB_SBW_SCRIPTS_DIR}

    const latestSbwScriptsDirectory = `${getPackageDirectorySync()}/${LATEST_PACKAGE_ROOT_DIR}/${GITHUB_SBW_SCRIPTS_DIR}`;
    const installedSbwScriptsDirectory = `${consumerPackageDirectory}/${GITHUB_SBW_SCRIPTS_DIR}`;

    if( !fileIoSyncNode.has_directory(installedSbwScriptsDirectory) ) {
        // If never installed, abort (unless forcing)
        if( !force ) return;

        fileIoSyncNode.make_directory(installedSbwScriptsDirectory);
    }

    const files = fileIoSyncNode.list_files(latestSbwScriptsDirectory);
    for( const file of files ) {
        const destinationUri = `${installedSbwScriptsDirectory}/${file.file}`;
        if( fileIoSyncNode.has_file(destinationUri) ) {
            // Stop it being readonly
            fileIoSyncNode.chmod_file(destinationUri, '755');
        }
        
        fileIoSyncNode.copy_file(
            `${latestSbwScriptsDirectory}/${file.file}`,
            destinationUri,
            {overwrite: true, make_directory: true}
        );
        // Mark it executable and readonly
        fileIoSyncNode.chmod_file(destinationUri, '555');
    }
}

async function updateGuide(userInput:IUserInput, consumerPackageDirectory:string):Promise<void> {
    // Always overwrite <destination-package-root>/${GITHUB_SBW_SCRIPTS_DIR}

    const latestGuideDirectory = `${getPackageDirectorySync()}/${LATEST_PACKAGE_ROOT_DIR}/${GUIDE_DIR}`;
    const installedGuideDirectory = `${consumerPackageDirectory}/${GUIDE_DIR}`;



    if( !fileIoSyncNode.has_directory(installedGuideDirectory) ) {
        // Ask if they want it 

        const responseInstall = await userInput.ask({
            type: 'confirm',
            message: `Do you want to install the Supabase Workflow Guide into your package root? (You can still read it even if you don't)`,
            name: 'install_guide'
        })
        if( responseInstall.type!=='confirmation' || !responseInstall.answer ) {
            // TODO Ask if they don't want to be asked again 
            return;
        }

        fileIoSyncNode.make_directory(installedGuideDirectory);
        
    }

    const files = fileIoSyncNode.list_files(latestGuideDirectory);
    for( const file of files ) {
        const destinationUri = `${installedGuideDirectory}/${file.file}`;
        if( fileIoSyncNode.has_file(destinationUri) ) {
            // Stop it being readonly
            fileIoSyncNode.chmod_file(destinationUri, '644');
        }
        
        fileIoSyncNode.copy_file(
            `${latestGuideDirectory}/${file.file}`,
            destinationUri,
            {overwrite: true, make_directory: true}
        );
        // Mark it readonly
        fileIoSyncNode.chmod_file(destinationUri, '444');
    }
}

async function addGithubPrecommitChecks(userInput:IUserInput, consumerPackageDirectory:string):Promise<void> {

    if( !fileIoSyncNode.has_directory(`${consumerPackageDirectory}/${GITHUB_WORKFLOWS_DIR}`) ) {
        // No point if not using GitHub Workflows (this may change if precommit gains more functionality!)
        console.log("Skipping adding GitHub Precommit helper, as not using GitHub Workflows");
        return;
    }
    

    const installedHookUri = `${consumerPackageDirectory}/${GITHUB_HOOKS_DIR}/pre-commit`;
    const invokerLine = `source ${GITHUB_SBW_SCRIPTS_DIR}/prehook.sh # Part of #Supabase-WorkFlow.`;

    // Retrieve existing
    const contents = fileIoSyncNode.read(installedHookUri);
    const hasInvokerLine = typeof contents==='string' && contents.indexOf(invokerLine)>-1;

    // Ask if they want to run pre-commit checks (only if missing)
    if( !hasInvokerLine ) {
        const responseInstall = await userInput.ask({
            type: 'confirm',
            message: "Add the Github Precommit hook that enables GitHub Workflows to check the servers have the same env var keys as local?",
            name: 'github_precommit_add'
        })
        if( responseInstall.type!=='confirmation' || !responseInstall.answer ) {
            console.log("Skipping adding Github Precommit helper");
            return;
        }
    }

    if( contents ) {
        if( !hasInvokerLine ) {
            // Append it
            fileIoSyncNode.write(installedHookUri, `${invokerLine}`, {append: true, appending_separator_only_if_file_exists: "\n\n"});
        }

    } else {
        // Create it
        fileIoSyncNode.write(installedHookUri, `#!/bin/sh\n\n${invokerLine}`, {make_directory: true});
        fileIoSyncNode.chmod_file(installedHookUri, '755');
    }
}

async function updateVsCodeWindowSettingsForDeno(userInput:IUserInput, consumerPackageDirectory:string):Promise<void> {
    // Ask if they want to modify .VSCode (only if missing)
    // Get the path: try to find in parent tree, or ask outright

    const subDirectories = await listSubDirectories(consumerPackageDirectory, undefined, /(^|\/)supabase$/);
    const supabaseDirectory = subDirectories[0];
    if( !supabaseDirectory ) {
        console.log("Supabase is not installed. Skipping Deno config for Supabase.");
        return;
    }
    
    

    let existingVsCodeDir: string | undefined;
    {
        let checkDir = consumerPackageDirectory;
        while( true ) {
            const testDir = `${checkDir}/.vscode`;
            if( fileIoSyncNode.has_directory(testDir) ) {
                existingVsCodeDir = testDir;
                break;
            }
            checkDir = fileIoSyncNode.directory_name(checkDir);
            if( checkDir.length<=2 ) break;
        }

        const responseCorrectDir = await userInput.ask({
            type: 'confirm', 
            name: 'confirm_existing_vscode_dir',
            message: `Is your .vscode directory, for the project's VSCode window, ${existingVsCodeDir}?`,
            default: true
        });
        if( responseCorrectDir.type!=='confirmation' ) return;
        if( responseCorrectDir.answer===false ) {
            existingVsCodeDir = undefined;
        } 
    }

    
    

    // See what the install paths should be, and what is installed
    const vscodeSettingsInstalled = readJsonFromFileSync(existingVsCodeDir? `${existingVsCodeDir}/settings.json` : undefined, {});

    let denoJsonUri:string;
    if( existingVsCodeDir && vscodeSettingsInstalled.object["deno.config"] ) {
        denoJsonUri = `${existingVsCodeDir}/${vscodeSettingsInstalled.object["deno.config"]}`;
    } else {
        denoJsonUri = `${consumerPackageDirectory}/deno.jsonc`;
    }
    const denoJsonInstalled = readJsonFromFileSync(denoJsonUri, {});

    

    const vscodeSettingsLatest = readJsonFromFileSync(`${getPackageDirectorySync()}/assets/deployable/.vscode/settings.json`, {});
    const denoJsonLatest = readJsonFromFileSync(`${getPackageDirectorySync()}/assets/deployable/package-root/deno.jsonc`, {});

    // Apply the latest to installed (if exists)


    const vscodeSettingsInstallable = merge({}, vscodeSettingsInstalled, vscodeSettingsLatest);
    const denoJsonInstallable = merge({}, denoJsonInstalled, denoJsonLatest);

    if( !isEqual(vscodeSettingsInstallable, vscodeSettingsInstalled) ) {
        const responseVscodeSettingsInstall = await userInput.ask({
            type: 'confirm',
            message: `${vscodeSettingsInstalled.file_found? 'Update' : 'Install'} the .vscode/settings.json that supports Deno and Supabase Functions?`,
            name: 'vscode_settings_install'
        });
        if( responseVscodeSettingsInstall.type==='confirmation' || responseVscodeSettingsInstall.answer ) {
            // Overwrite the file
            if( !existingVsCodeDir ) {
                let suggestedDirs = [consumerPackageDirectory];
                if( existingVsCodeDir ) suggestedDirs = [existingVsCodeDir, ...suggestedDirs];
                const directory = await getDirectoryFromUser(
                    userInput,
                    fileIoNode,
                    existingVsCodeDir ?? consumerPackageDirectory,
                    'vscode_dir',
                    "What is the root of your VSCode window? (Where .vscode must be placed)",
                    suggestedDirs
                )
                if( directory ) {
                    existingVsCodeDir = stripTrailingSlash(directory)
                }
            }
            if( existingVsCodeDir ) {
                
                const vsCodeSettingsInstallableUri = `${existingVsCodeDir}/settings.json`;
                const vsCodeSettingsToDenoJsonRelative = fileIoSyncNode.relative(fileIoSyncNode.directory_name(vsCodeSettingsInstallableUri), fileIoSyncNode.directory_name(denoJsonUri));
                if( vscodeSettingsInstallable.object["deno.config"] ) vscodeSettingsInstallable.object["deno.config"] = `${vsCodeSettingsToDenoJsonRelative}${denoJsonUri.replace(fileIoSyncNode.directory_name(denoJsonUri), '')}`;


                const vsCodeSettingsToSupabaseRelative = fileIoSyncNode.relative(fileIoSyncNode.directory_name(vsCodeSettingsInstallableUri), supabaseDirectory);
                const denoJsonToSupabaseRelative = fileIoSyncNode.relative(fileIoSyncNode.directory_name(denoJsonUri), supabaseDirectory);
                if( Array.isArray(vscodeSettingsInstallable.object["deno.enablePaths"]) ) {
                    vscodeSettingsInstallable.object["deno.enablePaths"] = vscodeSettingsInstallable.object["deno.enablePaths"].map(x => convertStringWithPathToSupabase(x, vsCodeSettingsToSupabaseRelative));
                }
                if( denoJsonInstallable.object["importMap"] ) {
                    denoJsonInstallable.object["importMap"] = convertStringWithPathToSupabase(denoJsonInstallable.object["importMap"], denoJsonToSupabaseRelative);
                }
                
                
                backupFileSync(vsCodeSettingsInstallableUri);
                fileIoSyncNode.write(vsCodeSettingsInstallableUri, JSON.stringify(vscodeSettingsInstallable.object, undefined, 4), {make_directory: true, overwrite: true})
            } else {
                console.log("Skipping .vscode/settings.json setup");
            }
        }
    }

    if( !isEqual(denoJsonInstallable, denoJsonInstalled) ) {
        const responseDenoJsonInstall = await userInput.ask({
            type: 'confirm',
            message: `${denoJsonInstalled.file_found? 'Update' : 'Install'} the deno.json(c) that supports Deno and Supabase Functions?`,
            name: 'deno_json_install'
        });
        if( responseDenoJsonInstall.type==='confirmation' || responseDenoJsonInstall.answer ) {
            
            backupFileSync(denoJsonUri);
            fileIoSyncNode.write(denoJsonUri, JSON.stringify(denoJsonInstallable.object, undefined, 4), {make_directory: true, overwrite: true})
            
        }
    }

    // If it has deno.json installed, but no import map, add it 
    const denoJsonInstalled2 = readJsonFromFileSync(denoJsonUri, {});
    if( denoJsonInstalled2.file_found ) {
        if( denoJsonInstalled2.file_found && denoJsonInstalled2.object.importMap ) {
            const importMapUri = `${fileIoSyncNode.directory_name(denoJsonUri)}/${denoJsonInstalled2.object.importMap}`
            const importMapIsInstalled = fileIoSyncNode.has_file(importMapUri);

            if( !importMapIsInstalled ) {
                fileIoSyncNode.write(importMapUri, "{}", {make_directory: true});
            }
        }
    }

    

}

function convertStringWithPathToSupabase(src:string, supabaseDirectory:string):string {
    if( src.indexOf('./supabase')===0 ) {
        return src.replace('./supabase', supabaseDirectory!);
    }
    return src;
}