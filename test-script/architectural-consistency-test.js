#!/usr/bin/env node

/**
 * Architectural Consistency Test Suite
 * Validates that ViewerKit's own features use universal fileOps APIs for consistency
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`     ${colors.cyan}${details}${colors.reset}`);
  }
}

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

// Test suite
const tests = [
  {
    name: 'Autosave uses fileOps writeFile instead of direct VS Code APIs',
    test: () => {
      const autosaveHostPath = '../src/features/autosave/host.ts';
      const content = readFileContent(autosaveHostPath);
      
      if (!content) return { passed: false, details: 'Could not read autosave host file' };
      
      // Check that it imports from fileOps
      const hasFileOpsImport = content.includes('from \'../fileOps/host\'');
      
      // Check that it uses fileOpsWriteFile instead of vscode.workspace.fs.writeFile
      const usesFileOpsWrite = content.includes('fileOpsWriteFile(');
      const avoidDirectVSCodeWrite = !content.includes('vscode.workspace.fs.writeFile(');
      
      // Check that it uses fileOps metadata
      const usesFileOpsMetadata = content.includes('writeResult.metadata');
      
      const passed = hasFileOpsImport && usesFileOpsWrite && avoidDirectVSCodeWrite && usesFileOpsMetadata;
      
      let details = '';
      if (!hasFileOpsImport) details += 'Missing fileOps import; ';
      if (!usesFileOpsWrite) details += 'Not using fileOpsWriteFile; ';
      if (!avoidDirectVSCodeWrite) details += 'Still using direct VS Code write; ';
      if (!usesFileOpsMetadata) details += 'Not using fileOps metadata; ';
      
      return { 
        passed, 
        details: passed ? 'Autosave correctly uses universal fileOps for all file operations' : details.trim()
      };
    }
  },

  {
    name: 'Autosave backup creation uses fileOps instead of VS Code copy',
    test: () => {
      const autosaveHostPath = '../src/features/autosave/host.ts';
      const content = readFileContent(autosaveHostPath);
      
      if (!content) return { passed: false, details: 'Could not read autosave host file' };
      
      // Check that backup creation uses fileOps read/write instead of VS Code copy
      const usesFileOpsRead = content.includes('fileOpsReadFile(');
      const avoidVSCodeCopy = !content.includes('vscode.workspace.fs.copy(');
      const hasBackupLogic = content.includes('createBackup');
      
      const passed = usesFileOpsRead && avoidVSCodeCopy && hasBackupLogic;
      
      let details = '';
      if (!usesFileOpsRead) details += 'Backup not using fileOps read; ';
      if (!avoidVSCodeCopy) details += 'Still using VS Code copy; ';
      if (!hasBackupLogic) details += 'Missing backup logic; ';
      
      return { 
        passed, 
        details: passed ? 'Backup creation correctly uses universal fileOps' : details.trim()
      };
    }
  },

  {
    name: 'HotReload requestFileContent uses fileOps instead of custom bridge handler',
    test: () => {
      const hotReloadWebPath = '../src/features/hotReload/web.ts';
      const content = readFileContent(hotReloadWebPath);
      
      if (!content) return { passed: false, details: 'Could not read hotReload web file' };
      
      // Check that requestFileContent imports and uses fileOps
      const usesFileOpsImport = content.includes('import(\'../fileOps/web\')');
      const callsFileOpsReadFile = content.includes('readFile(path)');
      const avoidDirectBridgeRequest = !content.includes('bridge.sendRequest<string>(\'read-file\'');
      
      const passed = usesFileOpsImport && callsFileOpsReadFile && avoidDirectBridgeRequest;
      
      let details = '';
      if (!usesFileOpsImport) details += 'Not importing fileOps; ';
      if (!callsFileOpsReadFile) details += 'Not calling fileOps readFile; ';
      if (!avoidDirectBridgeRequest) details += 'Still using direct bridge request; ';
      
      return { 
        passed, 
        details: passed ? 'HotReload correctly uses universal fileOps for content requests' : details.trim()
      };
    }
  },

  {
    name: 'FileOps host has bridge message handlers registered',
    test: () => {
      const fileOpsHostPath = '../src/features/fileOps/host.ts';
      const content = readFileContent(fileOpsHostPath);
      
      if (!content) return { passed: false, details: 'Could not read fileOps host file' };
      
      // Check that it imports getBridge
      const importsBridge = content.includes('getBridge');
      
      // Check that it registers bridge message handlers
      const hasReadFileHandler = content.includes('bridge.onMessage(\'read-file\'');
      const hasWriteFileHandler = content.includes('bridge.onMessage(\'write-file\'');
      const hasGetFileInfoHandler = content.includes('bridge.onMessage(\'get-file-info\'');
      
      // Check that handlers send responses
      const sendsResponses = content.includes('bridge.sendResponse(');
      
      const passed = importsBridge && hasReadFileHandler && hasWriteFileHandler && hasGetFileInfoHandler && sendsResponses;
      
      let details = '';
      if (!importsBridge) details += 'Missing bridge import; ';
      if (!hasReadFileHandler) details += 'Missing read-file handler; ';
      if (!hasWriteFileHandler) details += 'Missing write-file handler; ';
      if (!hasGetFileInfoHandler) details += 'Missing get-file-info handler; ';
      if (!sendsResponses) details += 'Not sending responses; ';
      
      return { 
        passed, 
        details: passed ? 'FileOps host correctly registers all bridge message handlers' : details.trim()
      };
    }
  },

  {
    name: 'No conflicting bridge message handlers between features',
    test: () => {
      const autosaveHostPath = '../src/features/autosave/host.ts';
      const hotReloadHostPath = '../src/features/hotReload/host.ts';
      const fileOpsHostPath = '../src/features/fileOps/host.ts';
      
      const autosaveContent = readFileContent(autosaveHostPath);
      const hotReloadContent = readFileContent(hotReloadHostPath);
      const fileOpsContent = readFileContent(fileOpsHostPath);
      
      if (!autosaveContent || !hotReloadContent || !fileOpsContent) {
        return { passed: false, details: 'Could not read one or more feature files' };
      }
      
      // Check that only fileOps registers read-file and write-file handlers
      const autosaveHasReadHandler = autosaveContent.includes('onMessage(\'read-file\'');
      const hotReloadHasReadHandler = hotReloadContent.includes('onMessage(\'read-file\'');
      const fileOpsHasReadHandler = fileOpsContent.includes('onMessage(\'read-file\'');
      
      const autosaveHasWriteHandler = autosaveContent.includes('onMessage(\'write-file\'');
      const hotReloadHasWriteHandler = hotReloadContent.includes('onMessage(\'write-file\'');
      const fileOpsHasWriteHandler = fileOpsContent.includes('onMessage(\'write-file\'');
      
      const noConflicts = !autosaveHasReadHandler && !hotReloadHasReadHandler && fileOpsHasReadHandler &&
                         !autosaveHasWriteHandler && !hotReloadHasWriteHandler && fileOpsHasWriteHandler;
      
      let details = '';
      if (autosaveHasReadHandler) details += 'Autosave has conflicting read handler; ';
      if (hotReloadHasReadHandler) details += 'HotReload has conflicting read handler; ';
      if (autosaveHasWriteHandler) details += 'Autosave has conflicting write handler; ';
      if (hotReloadHasWriteHandler) details += 'HotReload has conflicting write handler; ';
      if (!fileOpsHasReadHandler) details += 'FileOps missing read handler; ';
      if (!fileOpsHasWriteHandler) details += 'FileOps missing write handler; ';
      
      return { 
        passed: noConflicts, 
        details: noConflicts ? 'No conflicting bridge handlers found - only fileOps handles file operations' : details.trim()
      };
    }
  },

  {
    name: 'React hooks maintain compatibility with refactored features',
    test: () => {
      const useAutosavePath = '../src/hooks/useAutosave.ts';
      const useWatchedFilePath = '../src/hooks/useWatchedFile.ts';
      
      const useAutosaveContent = readFileContent(useAutosavePath);
      const useWatchedFileContent = readFileContent(useWatchedFilePath);
      
      if (!useAutosaveContent || !useWatchedFileContent) {
        return { passed: false, details: 'Could not read hook files' };
      }
      
      // Check that hooks still import from features (not directly from fileOps)
      const autosaveImportsFeature = useAutosaveContent.includes('from \'../features/autosave\'');
      const watchedFileImportsFeatures = useWatchedFileContent.includes('from \'../features/hotReload\'') &&
                                        useWatchedFileContent.includes('from \'../features/autosave\'');
      
      // Check that they use the public APIs
      const autosaveUsesWebAutosave = useAutosaveContent.includes('webAutosave(');
      const watchedFileUsesPublicAPIs = useWatchedFileContent.includes('requestFileContent(') &&
                                       useWatchedFileContent.includes('onFileChange(');
      
      const passed = autosaveImportsFeature && watchedFileImportsFeatures && 
                    autosaveUsesWebAutosave && watchedFileUsesPublicAPIs;
      
      let details = '';
      if (!autosaveImportsFeature) details += 'useAutosave not importing from feature; ';
      if (!watchedFileImportsFeatures) details += 'useWatchedFile not importing from features; ';
      if (!autosaveUsesWebAutosave) details += 'useAutosave not using webAutosave; ';
      if (!watchedFileUsesPublicAPIs) details += 'useWatchedFile not using public APIs; ';
      
      return { 
        passed, 
        details: passed ? 'React hooks maintain compatibility through public feature APIs' : details.trim()
      };
    }
  },

  {
    name: 'FileOps provides complete universal API coverage',
    test: () => {
      const fileOpsPublicPath = '../src/features/fileOps/public.ts';
      const fileOpsHostPath = '../src/features/fileOps/host.ts';
      const fileOpsWebPath = '../src/features/fileOps/web.ts';
      
      const publicContent = readFileContent(fileOpsPublicPath);
      const hostContent = readFileContent(fileOpsHostPath);
      const webContent = readFileContent(fileOpsWebPath);
      
      if (!publicContent || !hostContent || !webContent) {
        return { passed: false, details: 'Could not read fileOps files' };
      }
      
      // Check that all essential operations are exported
      const hasReadFile = publicContent.includes('readFile') && hostContent.includes('readFile') && webContent.includes('readFile');
      const hasWriteFile = publicContent.includes('writeFile') && hostContent.includes('writeFile') && webContent.includes('writeFile');
      const hasGetFileInfo = publicContent.includes('getFileInfo') && hostContent.includes('getFileInfo') && webContent.includes('getFileInfo');
      const hasValidateFile = publicContent.includes('validateFile') && hostContent.includes('validateFile') && webContent.includes('validateFile');
      
      // Check for metadata extraction
      const hasMetadata = hostContent.includes('FileMetadata') && webContent.includes('WebFileMetadata');
      
      // Check for React hook
      const hasReactHook = publicContent.includes('useFileOperations') && webContent.includes('useFileOperations');
      
      const passed = hasReadFile && hasWriteFile && hasGetFileInfo && hasValidateFile && hasMetadata && hasReactHook;
      
      let details = '';
      if (!hasReadFile) details += 'Missing readFile; ';
      if (!hasWriteFile) details += 'Missing writeFile; ';
      if (!hasGetFileInfo) details += 'Missing getFileInfo; ';
      if (!hasValidateFile) details += 'Missing validateFile; ';
      if (!hasMetadata) details += 'Missing metadata types; ';
      if (!hasReactHook) details += 'Missing React hook; ';
      
      return { 
        passed, 
        details: passed ? 'FileOps provides complete universal API coverage with metadata and React hooks' : details.trim()
      };
    }
  },

  {
    name: 'Documentation reflects architectural consistency changes',
    test: () => {
      const productDescPath = '../product-description.md';
      const planPath = '../plan.md';
      
      const productContent = readFileContent(productDescPath);
      const planContent = readFileContent(planPath);
      
      if (!productContent || !planContent) {
        return { passed: false, details: 'Could not read documentation files' };
      }
      
      // Check that directory structure shows fileOps instead of parsers
      const productShowsFileOps = productContent.includes('fileOps/') && !productContent.includes('parsers/');
      const planMentionsRefactor = planContent.includes('Architectural Consistency Refactor');
      
      // Check for universal file operations description
      const hasUniversalDescription = productContent.includes('Universal File Operations') && 
                                     productContent.includes('format-agnostic');
      
      const passed = productShowsFileOps && planMentionsRefactor && hasUniversalDescription;
      
      let details = '';
      if (!productShowsFileOps) details += 'Product description not updated for fileOps; ';
      if (!planMentionsRefactor) details += 'Plan missing refactor section; ';
      if (!hasUniversalDescription) details += 'Missing universal operations description; ';
      
      return { 
        passed, 
        details: passed ? 'Documentation properly reflects architectural consistency changes' : details.trim()
      };
    }
  }
];

// Run tests
async function runTests() {
  log('\n🔧 ViewerKit Architectural Consistency Test Suite', 'bold');
  log('=' * 60, 'cyan');
  log('Validating that ViewerKit features use universal fileOps APIs\n', 'yellow');
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const testCase of tests) {
    const result = testCase.test();
    logTest(testCase.name, result.passed, result.details);
    
    if (result.passed) {
      passedTests++;
    }
  }
  
  log('\n' + '=' * 60, 'cyan');
  
  if (passedTests === totalTests) {
    log(`🎉 All tests passed! (${passedTests}/${totalTests})`, 'green');
    log('✅ Architectural consistency verified', 'green');
    log('✅ ViewerKit features properly use universal fileOps', 'green');
    log('✅ No conflicting bridge handlers found', 'green');
    log('✅ React hooks maintain compatibility', 'green');
    log('✅ Documentation updated correctly', 'green');
  } else {
    log(`❌ ${totalTests - passedTests} test(s) failed (${passedTests}/${totalTests} passed)`, 'red');
    log('🔧 Please fix the failing tests before proceeding', 'yellow');
  }
  
  log('\n📋 Test Summary:', 'bold');
  log(`   Total Tests: ${totalTests}`, 'cyan');
  log(`   Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`   Failed: ${totalTests - passedTests}`, totalTests === passedTests ? 'green' : 'red');
  
  return passedTests === totalTests;
}

// Export for use in other scripts
module.exports = { runTests };

// Run if called directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  });
} 