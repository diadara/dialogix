const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function main() {
    const env = fs.readFileSync('.env', 'utf8');
    const lines = env.split('\n');

    for (const line of lines) {
        if (!line) continue;

        let [key, value] = line.split('=');
        value = value.replace(/"/g, '');

        try {
            const { stdout, stderr } = await exec(`fly secrets set ${key}=${value}`);
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        } catch (error) {
            console.error(`exec error: ${error}`);
        }
    }
}

main();