const { exec } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const runScript = (scriptPath, args = '') => {
  return new Promise((resolve, reject) => {
    const fullScriptPath = path.join(ROOT_DIR, scriptPath);
    console.log(`\n🚀 Running: node ${scriptPath} ${args}`);
    
    const scriptProcess = exec(`node "${fullScriptPath}" ${args}`, { cwd: ROOT_DIR });

    scriptProcess.stdout.on('data', (data) => console.log(data.toString()));
    scriptProcess.stderr.on('data', (data) => console.error(`❌ Error in ${path.basename(scriptPath)}:`, data.toString()));

    scriptProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Finished: ${path.basename(scriptPath)}`);
        resolve();
      } else {
        console.error(`🔥 Script ${path.basename(scriptPath)} exited with code ${code}.`);
        reject(new Error(`Script failed: ${path.basename(scriptPath)}`));
      }
    });
  });
};

const runAllDiagnostics = async () => {
  try {
    // --- CONFIGURATION ---
    // Yahan se aap chun sakte hain ki kin apps ko scan karna hai.
    // Options: 'web', 'desktop', 'mobile', 'all'
    const targetApps = ['web', 'desktop']; 
    // ---------------------

    console.log(`--- STARTING PROJECT DIAGNOSTICS for: [${targetApps.join(', ')}] ---`);
    
    const targetArgs = targetApps.join(',');

    // 1. Generate the file tree for the selected apps
    await runScript('scripts-all/generate-tree.cjs', targetArgs);
    
    // 2. Run the main health scan for the selected apps
    await runScript('scan-project-health.js', targetArgs);

    console.log('\n\n--- ✅ ALL DIAGNOSTICS COMPLETE ---');
    console.log('Check the console output above and generated files (project-tree.txt) for results.');

  } catch (error) {
    console.error('\n\n--- ❌ DIAGNOSTICS FAILED ---');
    console.error('One of the diagnostic scripts failed to complete.');
  }
};

runAllDiagnostics();