// Copyright (c) 2024 RAMPAGE Interactive
// Written by vq9o

import { execSync } from 'child_process';
import { Command } from 'commander';
import figlet from "figlet";
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { version as current_version } from './version.js';
import { createRequire } from 'module';
import unzipper from 'unzipper';

const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

console.log(figlet.textSync("Knight CLI"));
console.log("Copyright (c) 2025 RAMPAGE Interactive.");
console.log("Written by vq9o and Contributor(s).");
console.log(`Version: ${current_version}`);

const program = new Command();

program
    .version(current_version)
    .description('Knight CLI')

program
    .command('init [version]')
    .description('Automatically Install the Knight Framework and Rojo init.')
    .option('-d, --dir <directory>', 'Target directory for installation (default: current directory)')
    .action(async (version, options) => {
        version = version || 'latest';

        let tagVersion = version || 'latest';
        let targetDir = options.dir ? path.resolve(options.dir) : process.cwd();
        
        // auto-detect if "version" is actually a directory
        if (tagVersion.includes('/') || tagVersion.includes('\\')) {
            targetDir = path.resolve(tagVersion);
            tagVersion = 'latest';
        }

        try {
            fs.mkdirSync(targetDir, { recursive: true });

            // Fetch latest version if not specified
            if (version === 'latest') {
                console.log(chalk.blue('Fetching latest version...'));
                const response = await fetch('https://api.github.com/repos/RAMPAGELLC/knight/releases/latest');

                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }

                const data = await response.json();
                if (!data.tag_name) {
                    throw new Error('No release version found');
                }

                tagVersion = data.tag_name;
                console.log(chalk.blue(`Latest version found: ${tagVersion}`));
            }

            tagVersion = String(tagVersion).trim();

            if (!tagVersion) {
                console.log(chalk.red('Invalid version specified.'));
                return;
            }

            console.log(chalk.blue(`Preparing download...`));

            // Create a temporary directory for download
            const tempDir = path.join(targetDir, '.knight-temp');
            fs.mkdirSync(tempDir, { recursive: true });

            // Download the specified version
            const downloadUrl = `https://github.com/RAMPAGELLC/knight/archive/refs/tags/${tagVersion}.zip`;
            console.log(chalk.blue(`Downloading Knight Framework ${tagVersion}...`));

            const response = await fetch(downloadUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Save and extract the zip file
            const zipPath = path.join(tempDir, 'knight.zip');
            await fs.promises.writeFile(zipPath, Buffer.from(await response.arrayBuffer()));

            console.log(chalk.blue('Extracting files...'));

            // Extract to temp directory first
            const extractPath = path.join(tempDir, 'extract');
            await unzipper.Open.file(zipPath).then(d => d.extract({ path: extractPath }));

            // Find the extracted directory (should be knight-{version})
            const extractedDirs = fs.readdirSync(extractPath);
            const knightDir = extractedDirs.find(dir => dir.startsWith('knight-'));

            if (!knightDir) {
                throw new Error('Could not find Knight Framework directory in zip');
            }

            // Remove un-wanted files and directories
            const unwantedFiles = [
                'releases',
                '.git',
                '.github',
                'LICENSE',
                'README.md',
                'CHANGES.md',
                'src',
                'Packages',
                'gh-assets',
                'default.project.json',
                '.gitignore',
                '.editorconfig',
                'wally.toml',
                'wally.lock'
            ];

            for (const file of unwantedFiles) {
                const filePath = path.join(extractPath, knightDir, file);
                if (fs.existsSync(filePath)) fs.rmSync(filePath, { recursive: true, force: true });
            }

            const sourcePath = path.join(extractPath, knightDir);
            const templateFiles = fs.readdirSync(path.join(sourcePath, 'template'));

            // Copy contents from 'template' directory to current directory
            for (const file of templateFiles) {
                const src = path.join(sourcePath, 'template', file);
                const dest = path.join(targetDir, file);
            
                if (fs.lstatSync(src).isDirectory()) {
                    fs.cpSync(src, dest, { recursive: true });
                } else {
                    fs.copyFileSync(src, dest);
                }
            }

            // Remove the 'template' directory after copying
            fs.rmSync(path.join(sourcePath, 'template'), { recursive: true, force: true });

            // Copy rest of the contents from extracted directory to current directory
            const files = fs.readdirSync(sourcePath);

            for (const file of files) {
                if (file === 'template') continue; 
                
                const src = path.join(sourcePath, file);
                const dest = path.join(targetDir, file);

                if (fs.lstatSync(src).isDirectory()) {
                    fs.cpSync(src, dest, { recursive: true });
                } else {
                    fs.copyFileSync(src, dest);
                }
            }

            const configData = {
                version: tagVersion,
                installedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                type: "cli"
            };

            fs.writeFileSync(
                path.join(targetDir, 'Knight.config.json'),
                JSON.stringify(configData, null, 2)
            );

            console.log(chalk.blue('Created Knight.config.json'));

            // Update wally.toml if it exists
            const wallyPath = path.join(targetDir, 'wally.toml');
            const templatePath = path.join(__dirname, 'wally.template.toml');

            if (!fs.existsSync(wallyPath)) {
                console.log(chalk.red('wally.toml not found. Creating a new one...'));
                fs.writeFileSync(wallyPath, fs.readFileSync(templatePath, 'utf8'));
            } else {
                console.error(chalk.red('wally.template.toml not found. Cannot create wally.toml'));
            }

            const existingWallyData = fs.readFileSync(wallyPath, 'utf8');
            const newDependency = `knight = "vq9o/knight@${tagVersion.replace('v', '')}"`;

            fs.writeFileSync(
                path.join(targetDir, 'wally.toml'),
                existingWallyData.replace(
                    /\[dependencies\]\s*/g,
                    `[dependencies]\n${newDependency}\n`
                )
            );

            console.log(chalk.blue('Updated wally.toml with the new version'));
            console.log(chalk.blue('Running wall install...'));

            try {
                execSync('wally install', { stdio: 'inherit' });
            } catch (error) {
                console.log(chalk.yellow('Failed to run wally install. Please ensure Wally is installed and try again.'));
            }

            console.log(chalk.green('Wally package(s) installation complete!'));

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
            const response = await fetch('https://api.github.com/repos/RAMPAGELLC/knight/releases/latest');
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