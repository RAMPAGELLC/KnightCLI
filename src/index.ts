// Copyright (c) 2024 RAMPAGE Interactive
// Written by vq9o

import { execSync } from 'child_process';
import { Command } from 'commander';
import figlet from "figlet";
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { version as kpm_current_version } from './version.js';
import { GITHUB_API } from './config.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

console.log(figlet.textSync("Knight CLI client"));
console.log("Copyright (c) 2025 RAMPAGE Interactive.");
console.log("Written by vq9o and Contributor(s).");

const program = new Command();

program
    .version(kpm_current_version)
    .description('Knight CLI')

program
    .command('init [version]')
    .description('Automatically Install the Knight Framework and Rojo init.')
    .action(async (pkg, version = 'latest') => {
        try {
            let tagVersion = version;

            // Fetch latest version if not specified
            if (version === 'latest') {
                console.log(chalk.blue('Fetching latest version...'));
                const response = await fetch(GITHUB_API);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                tagVersion = data.tag_name;
            }

            console.log(chalk.blue(`Initializing Knight Framework (${tagVersion})...`));

            // Get current directory
            const currentDir = process.cwd();

            // Create a temporary directory for download
            const tempDir = path.join(currentDir, '.knight-temp');
            fs.mkdirSync(tempDir, { recursive: true });

            // Download the specified version
            const downloadUrl = `https://github.com/RAMPAGELLC/knight/archive/refs/tags/${tagVersion}.zip`;
            console.log(chalk.blue(`Downloading Knight Framework v${tagVersion}...`));

            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Save and extract the zip file
            const zipPath = path.join(tempDir, 'knight.zip');
            await fs.promises.writeFile(zipPath, Buffer.from(await response.arrayBuffer()));

            console.log(chalk.blue('Extracting files...'));

            await import('unzipper').then(({ Open }) =>
                Open.file(zipPath).then(d => d.extract({ path: currentDir }))
            );

            const configData = {
                version: tagVersion,
                installedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                type: "cli"
            };

            fs.writeFileSync(
                path.join(currentDir, 'Knight.config.json'),
                JSON.stringify(configData, null, 2)
            );

            console.log(chalk.blue('Created Knight.config.json'));

            // Cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });

            console.log(chalk.green('Knight Framework has been successfully installed!'));

            // Launch editor
            try {
                const editor = process.env.EDITOR || 'code';
                execSync(`${editor} .`, { stdio: 'inherit' });
            } catch (error) {
                console.log(chalk.yellow('Could not launch editor automatically. Please open the project manually.'));
            }

            console.log(chalk.green('Setup complete!'));
        } catch (error) {
            console.error(chalk.red('Installation failed:'), error);
            process.exit(1);
        }
    });

program
    .command('version-check')
    .description('Check if Knight CLI is up to date')
    .action(async () => {
        try {
            // Get current version
            const currentVersion = packageJson.version;
            console.log(chalk.blue(`Current version: ${currentVersion}`));

            // Fetch latest version from npm
            const response = await fetch('https://registry.npmjs.org/@rampagecorp/knight/latest');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const latestVersion = data.version;

            console.log(chalk.blue(`Latest version: ${latestVersion}`));

            if (currentVersion === latestVersion) {
                console.log(chalk.green('You are using the latest version!'));
            } else {
                console.log(chalk.yellow('A new version is available!'));
                console.log(chalk.yellow('Run the following command to update:'));
                console.log(chalk.white('knight npm'));
            }
        } catch (error) {
            console.error(chalk.red('Failed to check version:'), error);
        }
    });

program
    .command('check-updates')
    .description('Check if Knight Framework is up to date')
    .action(async () => {
        try {
            // Check if Knight Framework is installed
            const configPath = path.join(process.cwd(), 'Knight.config.json');
            if (!fs.existsSync(configPath)) {
                console.log(chalk.red('Knight Framework not found in current directory.'));
                console.log(chalk.yellow('Run "knight init" to install Knight Framework.'));
                return;
            }

            // Get current installed version
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const currentVersion = config.version;
            console.log(chalk.blue(`Current version: ${currentVersion}`));

            // Fetch latest version from GitHub
            const response = await fetch(GITHUB_API);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            const latestVersion = data.tag_name;

            console.log(chalk.blue(`Latest version: ${latestVersion}`));

            if (currentVersion === latestVersion) {
                console.log(chalk.green('Knight Framework is up to date!'));
            } else {
                console.log(chalk.yellow('A new version is available!'));
                console.log(chalk.yellow('Run the following command to update:'));
                console.log(chalk.white(`knight init ${latestVersion}`));
            }
        } catch (error) {
            console.error(chalk.red('Failed to check for updates:'), error);
            process.exit(1);
        }
    });

program
    .command('npm')
    .description('Uninstall and reinstall the Knight CLI Client to the latest version.').action(() => {
        try {
            console.log(chalk.blue('Uninstalling current version of Knight CLI...'));
            execSync('npm uninstall -g @rampagecorp/knight', { stdio: 'inherit' });

            console.log(chalk.blue('Installing the latest version of Knight CLI...'));
            execSync('npm install -g @rampagecorp/knight', { stdio: 'inherit' });

            console.log(chalk.green('Knight CLI has been successfully reinstalled.'));
        } catch (error) {
            console.error(chalk.red('Failed to uninstall / install the Knight CLI.'), error);
        }
    });

program.parse(process.argv);

if (!process.argv.slice(2).length) program.outputHelp();

const options = program.opts();