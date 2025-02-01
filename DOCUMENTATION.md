# CLI Client Documentation

## Installation

```sh
npm install -g @rampagecorp/knight
```

## Commands

### 1. Initialize a new project

Install the latest version of the Knight Framework & Rojo in the current directory.

```sh
knight init            # Latest version
knight init v1.0.0    # Specific version
```

### 2. Check for Updates

Check if your Knight Framework installation is up to date.

```sh
knight check-updates
```

### 3. Version Information

Display the CLI version.

```sh
knight --version
```

### 4. Help

Show available commands and usage.

```sh
knight --help
```

## Configuration

After initialization, a `Knight.config.json` file is created with the following structure:

```json
{
    "version": "1.0.0",
    "installedAt": "2024-03-20T00:00:00.000Z",
    "lastUpdated": "2024-03-20T00:00:00.000Z",
    "projectName": "my-project",
    "type": "cli"
}
```

## Troubleshooting

### Common Issues

1. Installation fails
   - Ensure you have Node.js 16+ installed
   - Check your network connection
   - Try running with administrator privileges

2. Editor doesn't open automatically
   - Set your EDITOR environment variable
   - Or manually open the project in your preferred editor

3. Update check fails
   - Verify internet connection
   - Check GitHub API access

## Support

For issues and feature requests, visit:
https://github.com/RAMPAGELLC/knight/issues