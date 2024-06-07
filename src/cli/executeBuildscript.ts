import { fileIoNode, fileIoSyncNode, getPackageDirectorySync } from "@andyrmitchell/file-io";
import { dLog } from "@andyrmitchell/utils";


/**
 * 
 * @param pathRelativeToBuildscripts E.g. "supabase/local_db_reset.sh"
 */
export async function executeBuildscript(filePath:string, startFrom?:'root' | 'package' | 'buildscripts', verbose?: boolean) {
    if( !startFrom ) startFrom = 'buildscripts';

    const getPackageDirectoryOptions = verbose? {testing: {verbose: true}} : undefined;

    let uri:string;
    if( startFrom==='root' ) {
        uri = filePath;
    } else if( startFrom==='package' ) {
        uri = `${getPackageDirectorySync(undefined, undefined, getPackageDirectoryOptions)}/${filePath}`;
    } else if( startFrom==='buildscripts' ) {
        uri = `${getPackageDirectorySync(undefined, undefined, getPackageDirectoryOptions)}/assets/buildscripts/${filePath}`;
    } else {
        throw new Error("Unknown startFrom");
    }

    if( verbose ) dLog('executeBuildScript', `executeBuildscript uri: ${uri}`);

    if( !(await fileIoNode.has_file(uri)) ) {
        throw new Error(`Cannot execute because file does not exist: ${uri}`);
    }
    
    await fileIoNode.chmod_file(uri, "755");
    const result = await fileIoNode.execute(uri, true);
    return result;
}