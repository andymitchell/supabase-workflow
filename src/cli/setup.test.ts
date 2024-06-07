import { Answer, IUserInput, QuestionChain, TestQuestionAnswerMap, TestUserInput, fileIoSyncNode, getPackageDirectorySync } from "@andyrmitchell/file-io";
import { existsSync, mkdirSync, rmSync } from "fs";

import { setup } from "./setup";
import { dLog } from "@andyrmitchell/utils";






const baseQuestionNameAnswers:TestQuestionAnswerMap = {
    'github_workflow_install': {type: 'confirmation', answer: true},
    'github_workflow_ignore': {type: 'confirmation', answer: false},
    'install_guide': {type: 'confirmation', answer: true},
    'github_precommit_add': {type: 'confirmation', answer: true},
    'confirm_existing_vscode_dir': {type: 'confirmation', answer: false},
    'vscode_settings_install': {type: 'confirmation', answer: true},
    'deno_json_install': {type: 'confirmation', answer: true},
    'vscode_dir': {type: 'single', answer: `<TMP_DIR>/.vscode`}
    
} 


function generateTestUserInput(questionNameAnswers:TestQuestionAnswerMap, tmpDir:string):IUserInput {
    questionNameAnswers = JSON.parse(JSON.stringify(questionNameAnswers).replace(/\<TMP_DIR\>/g, tmpDir));

    
    return new TestUserInput(questionNameAnswers);
}

describe('setup', () => {
    const TMPD_DIR_ROOT = `${getPackageDirectorySync()}/tmp_tests_setup`;
    let TMP_DIR:string;
    beforeAll(async () => {
        TMP_DIR = `${TMPD_DIR_ROOT}/${Math.round(Math.random()*1000000)+''}`;
        rmSync(TMPD_DIR_ROOT, { recursive: true, force: true });
    });
    afterAll(async () => {
        
        rmSync(TMPD_DIR_ROOT, { recursive: true, force: true });
    });

    beforeEach(() => {
        if (!existsSync(TMP_DIR)) {
            mkdirSync(TMP_DIR, {recursive: true});
        }
    });
    
    afterEach(() => {
        debugger;
        rmSync(TMP_DIR, { recursive: true, force: true });
    });

    test('basic', async () => {

        

        mkdirSync(`${TMP_DIR}/sub/supabase/functions`, {recursive:true});
        const userInput = generateTestUserInput(baseQuestionNameAnswers, TMP_DIR);

        await setup(userInput, TMP_DIR);

        expect(fileIoSyncNode.has_file(`${TMP_DIR}/.github/hooks/pre-commit`)).toBe(true);
        expect(fileIoSyncNode.has_file(`${TMP_DIR}/.github/_sbw_scripts/_shared.sh`)).toBe(true);
        expect(fileIoSyncNode.has_file(`${TMP_DIR}/.github/workflows/ci.yaml`)).toBe(true);
        expect(fileIoSyncNode.has_file(`${TMP_DIR}/.vscode/settings.json`)).toBe(true);
        expect(fileIoSyncNode.has_file(`${TMP_DIR}/deno.jsonc`)).toBe(true);
        expect(fileIoSyncNode.has_directory(`${TMP_DIR}/supabase-workflow-guide`)).toBe(true);
        expect(fileIoSyncNode.has_file(`${TMP_DIR}/sub/supabase/functions/import_map.json`)).toBe(true);
        
    }, 1000*60);

    // TODO Test different configurations of baseQuestionNameAnswers to cover the paths
    
})