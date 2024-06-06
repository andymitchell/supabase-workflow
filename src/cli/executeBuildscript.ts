import { fileIoNode, fileIoSyncNode, getPackageDirectorySync } from "@andyrmitchell/file-io";

/**
 * 
 * @param pathRelativeToBuildscripts E.g. "supabase/local_db_reset.sh"
 */
export async function executeBuildscript(filePath:string, startFrom:'root' | 'package' | 'buildscripts' = 'buildscripts') {
    let uri:string;
    if( startFrom==='root' ) {
        uri = filePath;
    } else if( startFrom==='package' ) {
        uri = `${getPackageDirectorySync()}/${filePath}`;
    } else if( startFrom==='buildscripts' ) {
        uri = `${getPackageDirectorySync()}/assets/buildscripts/${filePath}`;
    } else {
        throw new Error("Unknown startFrom");
    }

    if( !(await fileIoNode.has_file(uri)) ) {
        throw new Error(`Cannot execute because file does not exist: ${uri}`);
    }
    
    await fileIoNode.chmod_file(uri, "755");
    const result = await fileIoNode.execute(uri, true);
    return result;
}