import { fileIoNode, fileIoSyncNode, getPackageDirectorySync } from "@andyrmitchell/file-io";
import { dLog } from "@andyrmitchell/utils";


/**
 * 
 * @param pathRelativeToBuildscripts E.g. "supabase/local_db_reset.sh"
 */
export async function executeBuildscript(filePath:string, verbose?: boolean) {
    const uri = `${getPackageDirectorySync(undefined, undefined, verbose)}/assets/buildscripts/${filePath}`;

    
    if( verbose ) dLog('executeBuildScript', `executeBuildscript uri: ${uri}`);

    if( !(await fileIoNode.has_file(uri)) ) {
        throw new Error(`Cannot execute because file does not exist: ${uri}`);
    }
    
    await fileIoNode.chmod_file(uri, "755");
    const result = await fileIoNode.execute(uri, true);
    return result;
}