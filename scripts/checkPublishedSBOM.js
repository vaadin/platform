#!/usr/bin/env node

// Script to check published SBOMs for Vaadin Platform releases
// Requires:
// - curl
// - jq
// - go
// - bomber
// - osv-scanner
// - GITHUB_TOKEN environment variable set with a valid GitHub token
// For installing go, curl and jq you can use brew, choco, apt-get, depending on your OS
// For installing bomber and osv-scanner:
// - go install github.com/devops-kung-fu/bomber@latest
// - go install github.com/google/osv-scanner/cmd/osv-scanner@latest

const { spawn } = require('child_process');
const { parseArgs } = require('util');
const fs = require('fs');
const path = require('path');

// Configuration constants
const GITHUB_API_BASE = 'https://api.github.com/repos/vaadin/platform/releases';
const SBOM_BASE_URL = 'https://github.com/vaadin/platform/releases/download';
const CACHE_FILE = '/tmp/platform_releases_all.txt';
const TEMP_DIR = '/tmp';

// Global parsed arguments - will be set by parseArguments()
let args = {};

// Utility functions for logging
function log(...args) {
  process.stderr.write(`\x1b[0m> \x1b[0;32m${args}\x1b[0m\n`);
}

function err(...args) {
  process.stderr.write(`\x1b[0;31m${args.join(' ')}\x1b[0m\n`);
}

// Execute shell command with promise wrapper
async function exec(command, opts = {}) {
  const options = { debug: true, throw: true, ...opts };

  if (options.debug && !options.output) {
    log(command);
  }

  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(/\s+/);
    let stdout = "", stderr = "";

    const child = spawn(cmd, args);

    child.stdout.on('data', (data) => {
      stdout += data;
      if (!options.output && options.debug) {
        process.stderr.write(data);
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data;
      if (options.throw) {
        process.stderr.write(data);
      }
    });

    child.on('close', (code) => {
      if (options.output) {
        fs.writeFileSync(options.output, stdout);
      }

      if (options.throw && code !== 0) {
        reject({ stdout, stderr, code });
      } else {
        resolve({ stdout, stderr, code });
      }
    });
  });
}

// Run command with error handling
async function run(command, opts = {}) {
  try {
    return await exec(command, opts);
  } catch (ret) {
    if (!opts || opts.throw !== false) {
      if (ret.stderr) process.stderr.write(ret.stderr);
      err(`!! ERROR ${ret.code} !! running: ${command}!!`);
      process.exit(1);
    } else {
      if (ret.stderr) process.stderr.write(ret.stderr);
      return ret;
    }
  }
}

// Validate date format (YYYY-MM-DD)
function validateDate(dateInput) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    err("Error: Invalid date format. Please use YYYY-MM-DD format (e.g., 2024-01-01)");
    return false;
  }

  // Try to parse the date to ensure it's valid
  const date = new Date(dateInput);
  if (date.toISOString().split('T')[0] !== dateInput) {
    err("Error: Invalid date. Please provide a valid date in YYYY-MM-DD format");
    return false;
  }

  return true;
}

// Compare dates (returns true if date1 >= date2)
function dateIsGreaterOrEqual(date1, date2) {
  return date1 >= date2;
}

// Check if a release is a GA (General Availability) release
function isGaRelease(tagName) {
  return !/(alpha|beta|rc|snapshot|dev|pre|test)/i.test(tagName);
}

// Generate SBOM URL for a release
function generateSbomUrl(tagName) {
  return `${SBOM_BASE_URL}/${tagName}/Software.Bill.Of.Materials.json`;
}

// Generate SBOM file path
function generateSbomFilepath(releaseDate, tagName) {
  return path.join(TEMP_DIR, `SBOM_${releaseDate}_${tagName}.json`);
}

// Generate scan file paths
function getScanFilePaths(releaseDate, tagName) {
  const sbomFile = generateSbomFilepath(releaseDate, tagName);
  return {
    sbom: sbomFile,
    bomber: `${sbomFile}.bomber.scan`,
    osv: `${sbomFile}.osv-scanner.scan`
  };
}

// Download SBOM file if not exists
async function downloadSbom(releaseDate, tagName, sbomUrl) {
  const sbomFile = generateSbomFilepath(releaseDate, tagName);

  // Check if file already exists
  if (fs.existsSync(sbomFile)) {
    log(`  SBOM already exists: ${sbomFile}`);
    return true;
  }

  log(`  Downloading SBOM: ${sbomUrl}`);

  const tempFile = `${sbomFile}.tmp`;
  const result = await run(`curl -s -L -f -o ${tempFile} ${sbomUrl}`, { throw: false });

  if (result.code === 0) {
    // Verify it's valid JSON
    try {
      const content = fs.readFileSync(tempFile, 'utf8');
      JSON.parse(content);
      fs.renameSync(tempFile, sbomFile);
      log(`  SBOM saved: ${sbomFile}`);
      return true;
    } catch (error) {
      log(`  Error: Downloaded file is not valid JSON, removing`);
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      return false;
    }
  } else {
    log(`  Error: Failed to download SBOM from ${sbomUrl}`);
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    return false;
  }
}

// Scan SBOM file with bomber and osv-scanner
async function scanSbom(releaseDate, tagName, shouldScan) {
  if (!shouldScan) return true;

  const paths = getScanFilePaths(releaseDate, tagName);
  if (!fs.existsSync(paths.sbom)) return false;

  let scanSuccess = true;

  // Run bomber scan
  if (!fs.existsSync(paths.bomber)) {
    if ((await exec('which bomber', { debug: false, throw: false })).code !== 0) {
      log('  Warning: bomber command not found. Skipping bomber scan');
    } else {
      log(`  Scanning SBOM with bomber: ${paths.sbom}`);
      const result = await run(`bomber scan ${paths.sbom}`, {
        throw: false,
        output: paths.bomber
      });

      if (result.code === 0) {
        log(`  Bomber scan saved: ${paths.bomber}`);
      } else {
        log('  Error: Bomber scan failed, removing incomplete scan file');
        if (fs.existsSync(paths.bomber)) fs.unlinkSync(paths.bomber);
        scanSuccess = false;
      }
    }
  } else {
    log(`  Bomber scan already exists: ${paths.bomber}`);
  }

  // Run osv-scanner
  if (!fs.existsSync(paths.osv)) {
    let osvCmd = '';

    if ((await exec('which osv-scanner', { debug: false, throw: false })).code === 0) {
      osvCmd = 'osv-scanner';
    } else if (fs.existsSync(path.join(process.env.HOME || '', 'go/bin/osv-scanner'))) {
      osvCmd = path.join(process.env.HOME, 'go/bin/osv-scanner');
    } else {
      log('  Warning: osv-scanner command not found. Skipping osv-scanner scan');
    }

    if (osvCmd) {
      log(`  Scanning SBOM with osv-scanner: ${paths.sbom}`);
      const result = await run(`${osvCmd} --sbom=${paths.sbom}`, {
        throw: false,
        output: paths.osv
      });

      if (result.code === 0 || result.code === 1) {
        // Exit code 0 = no vulnerabilities, 1 = vulnerabilities found (both are successful scans)
        log(`  OSV-Scanner scan saved: ${paths.osv}`);
      } else {
        log(`  Error: OSV-Scanner scan failed (exit code: ${result.code}), removing incomplete scan file`);
        if (fs.existsSync(paths.osv)) fs.unlinkSync(paths.osv);
        scanSuccess = false;
      }
    }
  } else {
    log(`  OSV-Scanner scan already exists: ${paths.osv}`);
  }

  return scanSuccess;
}

// Display scan results for a version
function showScanResults(releaseDate, tagName) {
  const paths = getScanFilePaths(releaseDate, tagName);

  log('');
  log(`=== SCAN RESULTS FOR ${tagName} ===`);

  // Display bomber scan results
  log('');
  log('--- Bomber Scan Results ---');
  if (fs.existsSync(paths.bomber)) {
    const content = fs.readFileSync(paths.bomber, 'utf8');
    process.stdout.write(content);
  } else {
    log('No bomber scan results available. Run with --scan to generate.');
  }

  // Display osv-scanner scan results (filter out duplicate PURL warnings)
  log('');
  log('--- OSV-Scanner Scan Results ---');
  if (fs.existsSync(paths.osv)) {
    const content = fs.readFileSync(paths.osv, 'utf8');
    const filtered = content.split('\n')
      .filter(line => !line.includes('Warning, duplicate PURL found in SBOM:'))
      .join('\n');
    process.stdout.write(filtered);
  } else {
    log('No osv-scanner scan results available. Run with --scan to generate.');
  }

  log('');
  log('=========================');
}

// Generic GitHub API request helper
async function githubApiRequest(url, errorContext = 'GitHub API') {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    err('Error: GITHUB_TOKEN environment variable is not set');
    process.exit(1);
  }

  const https = require('https');

  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'checkPublishedSBOM.js'
      }
    };

    const req = https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse JSON response from ${errorContext}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Failed to fetch from ${errorContext}: ${error.message}`));
    });

    req.setTimeout(30000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

// Fetch GitHub releases with authentication
async function fetchGitHubReleases(page = 1, perPage = 100) {
  const url = `${GITHUB_API_BASE}?page=${page}&per_page=${perPage}`;
  return await githubApiRequest(url, 'GitHub API');
}

// Check for new releases by comparing first page
async function checkForNewReleases() {
  log('Checking for new releases...');

  const releases = await fetchGitHubReleases(1, 100);
  const apiFirstRelease = releases.length > 0 ?
    `${releases[0].published_at.split('T')[0]} ${releases[0].tag_name}` : '';

  let cachedFirstRelease = '';
  if (fs.existsSync(CACHE_FILE)) {
    const cached = fs.readFileSync(CACHE_FILE, 'utf8').trim();
    cachedFirstRelease = cached.split('\n')[0] || '';
  }

  if (cachedFirstRelease === apiFirstRelease) {
    log('No new releases found. Using cached data.');
    return false;
  } else {
    log('New releases found. Refreshing cache...');
    return true;
  }
}

// Get all releases from GitHub API with pagination
async function getAllReleasesFromAPI() {
  const allReleases = [];
  let page = 1;
  const perPage = 100;

  while (page <= 1000) { // Safety check
    const releases = await fetchGitHubReleases(page, perPage);

    if (releases.length === 0) break;

    for (const release of releases) {
      const releaseDate = release.published_at.split('T')[0];
      const tagName = release.tag_name;
      allReleases.push(`${releaseDate} ${tagName}`);
    }

    page++;
  }

  // Save to cache
  if (allReleases.length > 0) {
    fs.writeFileSync(CACHE_FILE, allReleases.join('\n'));
    log(`Cache saved to: ${CACHE_FILE}`);
  }

  return allReleases;
}

// Get cached releases or fetch new ones
async function getAllReleases() {
  if (!fs.existsSync(CACHE_FILE) || await checkForNewReleases()) {
    return await getAllReleasesFromAPI();
  }

  log(`Using cached releases from: ${CACHE_FILE}`);
  const cached = fs.readFileSync(CACHE_FILE, 'utf8').trim();
  return cached ? cached.split('\n') : [];
}

// Process releases with filtering and actions
async function processReleases(releases, filterFn = null, actionFn = null) {
  let filteredReleases = releases;

  if (filterFn) {
    filteredReleases = releases.filter(filterFn);
  }

  for (const release of filteredReleases) {
    const [releaseDate, tagName] = release.split(' ');
    const sbomUrl = generateSbomUrl(tagName);

    console.log(release);

    // Only show SBOM URL if there's an action (download/scan/show)
    if (actionFn) {
      log(`  SBOM: ${sbomUrl}`);
      await actionFn(releaseDate, tagName, sbomUrl);
    }
  }

  log(`Total releases found: ${filteredReleases.length}`);
  return filteredReleases;
}

// Get GA releases with SBOM URLs
async function getGaReleasesWithSbom(minDate, shouldDownload, shouldScan, shouldShow, shouldReport) {
  const allReleases = await getAllReleases();

  const filterFn = (release) => {
    const [releaseDate, tagName] = release.split(' ');

    if (minDate && !dateIsGreaterOrEqual(releaseDate, minDate)) {
      return false;
    }

    return isGaRelease(tagName);
  };

  const actionFn = (shouldDownload || shouldShow || shouldReport) ? async (releaseDate, tagName, sbomUrl) => {
    if (shouldDownload) {
      await downloadSbom(releaseDate, tagName, sbomUrl);
      await scanSbom(releaseDate, tagName, shouldScan);
    }

    if (shouldShow) {
      showScanResults(releaseDate, tagName);
    }
  } : null;

  log('GA Releases:');
  const results = await processReleases(allReleases, filterFn, actionFn);

  // Generate report if requested
  if (shouldReport) {
    const releaseData = results.map(r => {
      const [date, tag] = r.split(' ');
      return [date, tag];
    });
    await generateReport(releaseData);
  }

  return results;
}

// Get all releases
async function getAllReleasesProcessed(minDate, shouldDownload, shouldScan, shouldShow, shouldReport) {
  const allReleases = await getAllReleases();

  const filterFn = minDate ? (release) => {
    const [releaseDate] = release.split(' ');
    return dateIsGreaterOrEqual(releaseDate, minDate);
  } : null;

  const actionFn = (shouldDownload || shouldShow || shouldReport) ? async (releaseDate, tagName, sbomUrl) => {
    if (shouldDownload) {
      await downloadSbom(releaseDate, tagName, sbomUrl);
      await scanSbom(releaseDate, tagName, shouldScan);
    }

    if (shouldShow) {
      showScanResults(releaseDate, tagName);
    }
  } : null;

  const results = await processReleases(allReleases, filterFn, actionFn);

  // Generate report if requested
  if (shouldReport) {
    const releaseData = results.map(r => {
      const [date, tag] = r.split(' ');
      return [date, tag];
    });
    await generateReport(releaseData);
  }

  return results;
}

// Get latest version from each of the 4 most recent series
async function getLatestSeriesReleases(shouldDownload, shouldScan, forceLatest, gaOnly, shouldShow, shouldReport) {
  const allReleases = await getAllReleases();

  if (gaOnly) {
    log('Finding latest GA release from the 4 most recent series...');
  } else {
    log('Finding latest release (including pre-releases) from the 4 most recent series...');
  }

  const results = [];
  const seenSeries = new Set();
  let seriesCount = 0;

  for (const release of allReleases) {
    if (seriesCount >= 4) break;

    const [date, tag] = release.split(' ');

    // Apply GA filter if needed
    if (gaOnly && !isGaRelease(tag)) {
      continue;
    }

    // Extract series from version (e.g., "24.7" from "24.7.14")
    const seriesMatch = tag.match(/^(\d+\.\d+)\.\d+/);
    if (!seriesMatch) continue;

    const series = seriesMatch[1];

    // If this is a new series, it's the latest version for that series
    if (!seenSeries.has(series)) {
      results.push({ series, date, version: tag });
      seenSeries.add(series);
      seriesCount++;
    }
  }

  // Sort results by series version (newest series first, then reverse to show oldest first)
  const sortedResults = results
    .sort((a, b) => {
      const [aMajor, aMinor] = a.series.split('.').map(Number);
      const [bMajor, bMinor] = b.series.split('.').map(Number);
      return bMajor === aMajor ? bMinor - aMinor : bMajor - aMajor;
    })
    .slice(0, 4)
    .reverse();

  // Output results
  for (const result of sortedResults) {
    const sbomUrl = generateSbomUrl(result.version);

    console.log(`${result.date} ${result.version}`);

    // Only show SBOM URL if downloading or performing actions
    if (shouldDownload || shouldShow || shouldReport) {
      log(`  SBOM: ${sbomUrl}`);
    }

    if (shouldDownload) {
      // Remove existing scan files if --latest flag is used
      if (forceLatest) {
        const paths = getScanFilePaths(result.date, result.version);

        if (fs.existsSync(paths.bomber)) {
          log('  Removing cached bomber scan file for fresh scan');
          fs.unlinkSync(paths.bomber);
        }
        if (fs.existsSync(paths.osv)) {
          log('  Removing cached osv-scanner scan file for fresh scan');
          fs.unlinkSync(paths.osv);
        }
      }

      await downloadSbom(result.date, result.version, sbomUrl);
      await scanSbom(result.date, result.version, shouldScan);
    }

    if (shouldShow) {
      showScanResults(result.date, result.version);
    }
  }

  // Generate report if requested
  if (shouldReport) {
    const releases = sortedResults.map(r => [r.date, r.version]);
    await generateReport(releases);
  }
}

// Get specific version release
async function getVersionRelease(versionFilter, shouldDownload, shouldScan, forceLatest, shouldShow, shouldReport) {
  log(`Fetching release information for version ${versionFilter}...`);

  const url = `https://api.github.com/repos/vaadin/platform/releases/tags/${versionFilter}`;
  const response = await githubApiRequest(url, 'GitHub release API');

  if (response.message === 'Not Found') {
    err(`Error: Version ${versionFilter} not found in repository vaadin/platform`);
    process.exit(1);
  }

  const releaseDate = response.published_at.split('T')[0];
  const tagName = response.tag_name;
  const sbomUrl = generateSbomUrl(tagName);

  log(`Version ${versionFilter}:`);
  console.log(`${releaseDate} ${tagName}`);

  // Only show SBOM URL if downloading or performing actions
  if (shouldDownload || shouldShow || shouldReport) {
    log(`  SBOM: ${sbomUrl}`);
  }

  if (shouldDownload) {
    // Remove existing scan files if --latest flag is used
    if (forceLatest) {
      const paths = getScanFilePaths(releaseDate, tagName);

      if (fs.existsSync(paths.bomber)) {
        log('  Removing cached bomber scan file for fresh scan');
        fs.unlinkSync(paths.bomber);
      }
      if (fs.existsSync(paths.osv)) {
        log('  Removing cached osv-scanner scan file for fresh scan');
        fs.unlinkSync(paths.osv);
      }
    }

    await downloadSbom(releaseDate, tagName, sbomUrl);
    await scanSbom(releaseDate, tagName, shouldScan);

    // Display scan results for version mode if --scan was used
    if (shouldScan) {
      showScanResults(releaseDate, tagName);
    }
  }

  // Show scan results if requested (regardless of whether scan was performed in this run)
  if (shouldShow) {
    showScanResults(releaseDate, tagName);
  }

  // Generate report if requested
  if (shouldReport) {
    await generateReport([[releaseDate, tagName]]);
  }

  log('');
  log('Release found and processed.');
}

// Check required dependencies
async function checkDependencies(scanMode = false) {
  const missingDeps = [];
  const optionalDeps = [];

  // Check required dependencies
  if ((await exec('which curl', { debug: false, throw: false })).code !== 0) {
    missingDeps.push('curl');
  }

  if ((await exec('which jq', { debug: false, throw: false })).code !== 0) {
    missingDeps.push('jq');
  }

  // Check optional scanning dependencies
  if ((await exec('which bomber', { debug: false, throw: false })).code !== 0) {
    optionalDeps.push('bomber');
  }

  const osvPath = path.join(process.env.HOME || '', 'go/bin/osv-scanner');
  if ((await exec('which osv-scanner', { debug: false, throw: false })).code !== 0 &&
      !fs.existsSync(osvPath)) {
    optionalDeps.push('osv-scanner');
  }

  // Exit if required dependencies are missing
  if (missingDeps.length > 0) {
    err('Error: Required dependencies are missing:');
    for (const dep of missingDeps) {
      err(`  - ${dep}`);
    }
    err('');
    err('Please install the missing dependencies:');
    err('  - curl: Usually available by default or via package manager');
    err('  - jq: Install via package manager (brew install jq, apt install jq, etc.)');
    process.exit(1);
  }

  // Warn about optional dependencies only when scanning is requested
  if (scanMode && optionalDeps.length > 0) {
    log('Warning: Optional scanning dependencies are missing:');
    for (const dep of optionalDeps) {
      log(`  - ${dep}`);
    }
    log('');
    log('Install scanning tools for full functionality:');
    log('  - bomber: go install github.com/devops-kung-fu/bomber@latest');
    log('  - osv-scanner: go install github.com/google/osv-scanner/cmd/osv-scanner@v1');
    log('');
    log('Continuing with available scanners...');
  }
}

// Show help message
function showHelp() {
  const scriptName = path.basename(process.argv[1]);
  console.log(`Usage: ${scriptName} [OPTIONS] [YYYY-MM-DD]
Options:
  --ga, --ga-releases    Show only GA releases (excludes alpha/beta/RC)
  --download, -d         Download SBOM files to /tmp/SBOM_DATE_VERSION.json
  --scan, -s             Download and scan SBOM files with bomber and osv-scanner
  --show                 Display scan results for filtered versions (requires existing scan files)
  --report               Generate comprehensive vulnerability report from existing scan files
  --version VERSION      Test specific version only (e.g., --version 24.7.0)
  --latest               When used with --version: force fresh scans by discarding cached scan files
                         When used alone: show latest version from the 4 most recent release series
                         (combine with --ga to show only GA versions from those series)
  --help, -h             Show this help message

All releases include SBOM URLs in the format:
https://github.com/vaadin/platform/releases/download/{tag}/Software.Bill.Of.Materials.json

Scanning creates two files for each SBOM:
  - file.bomber.scan (bomber vulnerability scanner output)
  - file.osv-scanner.scan (OSV vulnerability scanner output)

Examples:
  ${scriptName}                             # Show all releases with SBOM URLs
  ${scriptName} 2024-01-01                  # Show releases from 2024-01-01 onwards with SBOM URLs
  ${scriptName} --ga 2025-09-01             # Show only GA releases from 2025-09-01 with SBOM URLs
  ${scriptName} --download --ga 2025-09-01  # Download GA SBOM files from 2025-09-01
  ${scriptName} --scan --ga 2025-09-01      # Download and scan GA SBOM files with both scanners
  ${scriptName} --version 24.7.0 --scan     # Test specific version 24.7.0 and scan it
  ${scriptName} --version 24.7.0 --scan --latest  # Force fresh scan of version 24.7.0
  ${scriptName} --latest                    # Show latest version from the 4 most recent series (includes pre-releases)
  ${scriptName} --latest --ga               # Show latest GA version from the 4 most recent series
  ${scriptName} --latest --show             # Show latest versions and their scan results
  ${scriptName} --ga 2025-09-01 --show      # Show GA releases from date and their scan results
  ${scriptName} --ga 2025-09-01 --report    # Generate vulnerability report for GA releases from date`);
}

// Parse command line arguments
function parseArguments() {
  const argOptions = {
    'ga': { type: 'boolean' },
    'ga-releases': { type: 'boolean' },
    'download': { type: 'boolean', short: 'd' },
    'scan': { type: 'boolean', short: 's' },
    'show': { type: 'boolean' },
    'report': { type: 'boolean' },
    'version': { type: 'string' },
    'latest': { type: 'boolean' },
    'help': { type: 'boolean', short: 'h' }
  };

  let parsed;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: argOptions,
      allowPositionals: true,
      strict: true
    });
  } catch (error) {
    // Handle parseArgs errors with helpful messages
    if (error.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
      const optionName = error.input || error.message.match(/'([^']+)'/)?.[1] || 'unknown';
      err(`Error: Unknown option '${optionName}'`);
      err('Use --help for usage information');
      process.exit(1);
    } else if (error.code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE') {
      err(`Error: Invalid value for option '${error.option}'`);
      err('Use --help for usage information');
      process.exit(1);
    } else {
      err(`Error: ${error.message}`);
      err('Use --help for usage information');
      process.exit(1);
    }
  }

  const { values, positionals } = parsed;

  // Handle help first
  if (values.help) {
    showHelp();
    process.exit(0);
  }

  // Handle positional argument (date)
  if (positionals.length > 0) {
    values.dateFilter = positionals[0];

    if (!validateDate(values.dateFilter)) {
      err(`Usage: ${path.basename(process.argv[1])} [OPTIONS] [YYYY-MM-DD]`);
      err('Use --help for more information');
      process.exit(1);
    }

    // Check for extra positional arguments
    if (positionals.length > 1) {
      err(`Error: Unexpected argument '${positionals[1]}'`);
      err('Use --help for usage information');
      process.exit(1);
    }
  }

  // Validate that version filter and date filter are not used together
  if (values.version && values.dateFilter) {
    err('Error: Cannot use both --version and date filter together');
    err('Use --help for usage information');
    process.exit(1);
  }

  // Set scanning requires downloading
  if (values.scan) {
    values.download = true;
  }

  // Set global args for use throughout the application
  args = values;
}

// Generate vulnerability report from scan files
async function generateReport(releases) {
  log('');
  log('=== GENERATING VULNERABILITY REPORT ===');

  const packageVulns = new Map(); // packageKey:version -> { vaadinVersions: Set, vulnerabilities: Set, severities: Set }
  const severityStats = { CRITICAL: 0, HIGH: 0, MODERATE: 0, LOW: 0 };
  const versionData = [];

  for (const release of releases) {
    const [releaseDate, tagName] = Array.isArray(release) ? release : release.split(' ');
    const paths = getScanFilePaths(releaseDate, tagName);

    // Check if scan files exist
    if (!fs.existsSync(paths.bomber) && !fs.existsSync(paths.osv)) {
      continue;
    }

    versionData.push({ releaseDate, tagName, paths });

    // Parse bomber scan results
    if (fs.existsSync(paths.bomber)) {
      try {
        const bomberContent = fs.readFileSync(paths.bomber, 'utf8');
        parseBomberResults(bomberContent, tagName, packageVulns, severityStats);
      } catch (error) {
        log(`  Warning: Failed to parse bomber scan for ${tagName}`);
      }
    }

    // Parse OSV scanner results
    if (fs.existsSync(paths.osv)) {
      try {
        const osvContent = fs.readFileSync(paths.osv, 'utf8');
        parseOsvResults(osvContent, tagName, packageVulns, severityStats);
      } catch (error) {
        log(`  Warning: Failed to parse OSV scan for ${tagName}`);
      }
    }
  }

  if (versionData.length === 0) {
    log('No scan files found for the specified criteria. Run with --scan first.');
    return;
  }

  // Generate report
  console.log('\n' + '='.repeat(80));
  console.log('VULNERABILITY REPORT');
  console.log('='.repeat(80));
  const dates = versionData.map(v => v.releaseDate).sort();
  const dateRange = dates.length > 1 ? `${dates[0]} to ${dates[dates.length-1]}` : dates[0] || 'Unknown';

  console.log(`Generated: ${new Date().toISOString()}`);
  console.log(`Scanned versions: ${versionData.length}`);
  console.log(`Date range: ${dateRange}`);

  // Summary statistics
  console.log('\n' + '-'.repeat(40));
  console.log('SEVERITY SUMMARY');
  console.log('-'.repeat(40));
  const total = Object.values(severityStats).reduce((a, b) => a + b, 0);
  for (const [severity, count] of Object.entries(severityStats)) {
    if (count > 0) {
      console.log(`${severity.padEnd(10)}: ${count.toString().padStart(4)} (${((count/total)*100).toFixed(1)}%)`);
    }
  }
  console.log(`${'TOTAL'.padEnd(10)}: ${total.toString().padStart(4)}`);

  // Package vulnerabilities section
  console.log('\n' + '-'.repeat(95));
  console.log('PACKAGES WITH VULNERABILITIES');
  console.log('-'.repeat(95));
  console.log('Sev ' + 'Package:Version'.padEnd(40) + 'Vaadin Versions'.padEnd(20) + 'Count  Example');
  console.log('-'.repeat(95));

  const sortedPackages = Array.from(packageVulns.entries())
    .sort(([,a], [,b]) => b.vulnerabilities.size - a.vulnerabilities.size);

  for (const [packageVersionKey, data] of sortedPackages) {
    // Remove groupId from Maven packages for cleaner display
    const displayKey = packageVersionKey.replace(/^maven:([^:]+:)?([^:]+):(.+)$/, 'maven:$2:$3');

    const vaadinVersions = Array.from(data.vaadinVersions).sort();
    const vaadinVersionsStr = vaadinVersions.join(', ');

    // Get highest severity as single letter
    const maxSeverity = getHighestSeverity(data.severities);
    const severityLetter = severityToLetter(maxSeverity);

    // Get first vulnerability, preferring CVE over GHSA
    const vulnArray = Array.from(data.vulnerabilities);
    const cveVulns = vulnArray.filter(v => v.startsWith('CVE-'));
    const firstVuln = cveVulns.length > 0 ? cveVulns[0] : vulnArray[0];

    console.log(
      `${severityLetter}   ${displayKey.padEnd(40)}${vaadinVersionsStr.padEnd(20)}${data.vulnerabilities.size.toString().padEnd(7)}${firstVuln}`
    );
  }

  console.log('\n' + '='.repeat(80));
  log(`Report generated successfully. Found ${total} vulnerabilities across ${packageVulns.size} packages.`);

  // Also write to GitHub Step Summary if running in GitHub Actions
  if (isGitHubActions()) {
    writeVulnerabilityReportToGitHub(versionData, severityStats, packageVulns, total);
  }
}

// Get the highest severity level from a set of severities
function getHighestSeverity(severities) {
  const severityOrder = ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'];
  for (const severity of severityOrder) {
    if (severities.has(severity)) {
      return severity;
    }
  }
  return 'UNKNOWN';
}

// Convert severity to single letter
function severityToLetter(severity) {
  switch (severity) {
    case 'CRITICAL': return 'C';
    case 'HIGH': return 'H';
    case 'MODERATE': return 'M';
    case 'LOW': return 'L';
    default: return '?';
  }
}

// Check if running in GitHub Actions
function isGitHubActions() {
  return process.env.GITHUB_ACTIONS === 'true';
}

// Write to GitHub step summary
function writeToGitHubStepSummary(content) {
  if (!isGitHubActions()) return;

  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (summaryFile) {
    try {
      fs.appendFileSync(summaryFile, content + '\n');
    } catch (error) {
      log('Warning: Failed to write to GitHub step summary:', error.message);
    }
  }
}

// Format and write vulnerability report to GitHub step summary
function writeVulnerabilityReportToGitHub(versionData, severityStats, packageVulns, total) {
  let markdown = `\n## 🛡️ Vulnerability Report\n\n`;
  const dates = versionData.map(v => v.releaseDate).sort();
  const dateRange = dates.length > 1 ? `${dates[0]} to ${dates[dates.length-1]}` : dates[0] || 'Unknown';

  markdown += `**Generated:** ${new Date().toISOString()}\n`;
  markdown += `**Scanned versions:** ${versionData.length}\n`;
  markdown += `**Date range:** ${dateRange}\n\n`;

  // Severity summary
  markdown += `### Severity Summary\n\n`;
  markdown += `| Severity | Count | Percentage |\n`;
  markdown += `|----------|-------|------------|\n`;

  for (const [severity, count] of Object.entries(severityStats)) {
    if (count > 0) {
      const percentage = ((count/total)*100).toFixed(1);
      markdown += `| ${severity} | ${count} | ${percentage}% |\n`;
    }
  }
  markdown += `| **TOTAL** | **${total}** | **100%** |\n\n`;

  // Package vulnerabilities table
  if (packageVulns.size > 0) {
    markdown += `### Packages with Vulnerabilities\n\n`;
    markdown += `| Sev | Package:Version | Vaadin Versions | Count | Example |\n`;
    markdown += `|-----|-----------------|-----------------|-------|----------|\n`;

    const sortedPackages = Array.from(packageVulns.entries())
      .sort(([,a], [,b]) => b.vulnerabilities.size - a.vulnerabilities.size);

    for (const [packageVersionKey, data] of sortedPackages) {
      // Remove groupId from Maven packages for cleaner display
      const displayKey = packageVersionKey.replace(/^maven:([^:]+:)?([^:]+):(.+)$/, 'maven:$2:$3');

      const vaadinVersions = Array.from(data.vaadinVersions).sort();
      const vaadinVersionsStr = vaadinVersions.join(', ');

      // Get highest severity as single letter
      const maxSeverity = getHighestSeverity(data.severities);
      const severityLetter = severityToLetter(maxSeverity);

      // Get first vulnerability, preferring CVE over GHSA
      const vulnArray = Array.from(data.vulnerabilities);
      const cveVulns = vulnArray.filter(v => v.startsWith('CVE-'));
      const firstVuln = cveVulns.length > 0 ? cveVulns[0] : vulnArray[0];

      // Escape pipe characters in table content
      const escapedDisplayKey = displayKey.replace(/\|/g, '\\|');
      const escapedVersionsStr = vaadinVersionsStr.replace(/\|/g, '\\|');
      const escapedFirstVuln = firstVuln.replace(/\|/g, '\\|');

      markdown += `| ${severityLetter} | \`${escapedDisplayKey}\` | ${escapedVersionsStr} | ${data.vulnerabilities.size} | ${escapedFirstVuln} |\n`;
    }
  }

  markdown += `\n---\n*Found ${total} vulnerabilities across ${packageVulns.size} packages*\n\n`;

  writeToGitHubStepSummary(markdown);
}

// Normalize package names for consistent reporting
function normalizePackageName(ecosystem, packageName) {
  if (ecosystem.toLowerCase() === 'maven') {
    // For Maven packages, prefer the full groupId:artifactId format
    // Some tools report just the artifactId, others report the full coordinate
    if (packageName.includes(':')) {
      return packageName; // Already in full format
    }

    // Map common short names to full coordinates
    const knownMappings = {
      'spring-core': 'org.springframework:spring-core',
      'spring-web': 'org.springframework:spring-web',
      'spring-webmvc': 'org.springframework:spring-webmvc',
      'spring-context': 'org.springframework:spring-context',
      'spring-expression': 'org.springframework:spring-expression',
      'spring-boot': 'org.springframework.boot:spring-boot',
      'spring-security-core': 'org.springframework.security:spring-security-core',
      'tomcat-embed-core': 'org.apache.tomcat.embed:tomcat-embed-core',
      'logback-core': 'ch.qos.logback:logback-core',
      'jackson-core': 'com.fasterxml.jackson.core:jackson-core',
      'poi-ooxml': 'org.apache.poi:poi-ooxml',
      'nimbus-jose-jwt': 'com.nimbusds:nimbus-jose-jwt'
    };

    return knownMappings[packageName] || packageName;
  }

  return packageName; // For npm and other ecosystems, use as-is
}

// Parse bomber scan results
function parseBomberResults(content, tagName, packageVulns, severityStats) {
  const lines = content.split('\n');
  let inTable = false;
  let currentEcosystem = '';

  for (const line of lines) {
    // Look for table header
    if (line.includes('│ TYPE') && line.includes('│ NAME')) {
      inTable = true;
      continue;
    }

    // Skip separator lines
    if (line.includes('├───────┼───────') || line.includes('╭───────┬───────')) {
      continue;
    }

    // End of table
    if (line.includes('╰───────┴───────')) {
      inTable = false;
      currentEcosystem = '';
      continue;
    }

    // Parse table rows
    if (inTable && line.includes('│')) {
      const parts = line.split('│').map(p => p.trim());

      // Expected format: │ TYPE │ NAME │ VERSION │ SEVERITY │ VULNERABILITY │ EPSS % │
      if (parts.length >= 6) {
        const [, type, name, version, severity, vulnerability] = parts;

        // Skip header row
        if (name === 'NAME' || severity === 'SEVERITY') continue;

        // If type is empty, use current ecosystem (continuation row)
        const ecosystem = type || currentEcosystem;
        if (type) currentEcosystem = type;

        if (ecosystem && name && version && severity && vulnerability) {
          // Normalize package names for consistency
          const normalizedName = normalizePackageName(ecosystem, name);
          const packageVersionKey = `${ecosystem}:${normalizedName}:${version}`;
          const cve = vulnerability.startsWith('CVE-') ? vulnerability : vulnerability;

          if (!packageVulns.has(packageVersionKey)) {
            packageVulns.set(packageVersionKey, { vaadinVersions: new Set(), vulnerabilities: new Set(), severities: new Set() });
          }

          const pkg = packageVulns.get(packageVersionKey);
          pkg.vaadinVersions.add(tagName);
          pkg.vulnerabilities.add(cve);

          // Track severity for this package
          const sev = severity.toUpperCase();
          pkg.severities.add(sev);

          // Count severity
          if (severityStats.hasOwnProperty(sev)) {
            severityStats[sev]++;
          }
        }
      }
    }
  }
}

// Parse OSV scanner results
function parseOsvResults(content, tagName, packageVulns, severityStats) {
  const lines = content.split('\n');

  for (const line of lines) {
    // Look for vulnerability table rows - specifically lines with OSV URLs
    if (line.includes('| https://osv.dev/') && line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p && p !== '');

      // OSV table format: | OSV URL | CVSS | ECOSYSTEM | PACKAGE | VERSION | SOURCE |
      if (parts.length >= 5) {
        const osvUrl = parts[0];
        const cvss = parts[1];
        const ecosystem = parts[2];
        const packageName = parts[3];
        const version = parts[4];

        if (osvUrl.includes('osv.dev/') && ecosystem && packageName && version) {
          const vulnId = osvUrl.split('/').pop();
          // Normalize package names for consistency
          const normalizedName = normalizePackageName(ecosystem.toLowerCase(), packageName);
          const packageVersionKey = `${ecosystem.toLowerCase()}:${normalizedName}:${version}`;

          if (!packageVulns.has(packageVersionKey)) {
            packageVulns.set(packageVersionKey, { vaadinVersions: new Set(), vulnerabilities: new Set(), severities: new Set() });
          }

          const pkg = packageVulns.get(packageVersionKey);
          pkg.vaadinVersions.add(tagName);
          pkg.vulnerabilities.add(vulnId);

          // Estimate severity from CVSS score
          if (cvss && !isNaN(parseFloat(cvss))) {
            const score = parseFloat(cvss);
            let severity = 'LOW';
            if (score >= 9.0) severity = 'CRITICAL';
            else if (score >= 7.0) severity = 'HIGH';
            else if (score >= 4.0) severity = 'MODERATE';

            // Track severity for this package
            pkg.severities.add(severity);
            severityStats[severity]++;
          }
        }
      }
    }
  }
}

// Main execution function
async function main() {
  parseArguments();

  // Check for required dependencies first
  await checkDependencies();

  // Check scanning dependencies if scan mode is requested
  if (args.scan) {
    await checkDependencies(true);
  }

  // Execute based on arguments
  if (args.version) {
    // Version-specific mode
    await getVersionRelease(
      args.version,
      args.download,
      args.scan,
      args.latest,
      args.show,
      args.report
    );
  } else if (args.latest) {
    // Latest series mode (4 most recent series)
    await getLatestSeriesReleases(
      args.download,
      args.scan,
      args.latest,
      (args.ga || args['ga-releases']),
      args.show,
      args.report
    );
  } else if (args.ga || args['ga-releases']) {
    await getGaReleasesWithSbom(
      args.dateFilter,
      args.download,
      args.scan,
      args.show,
      args.report
    );
  } else {
    await getAllReleasesProcessed(
      args.dateFilter,
      args.download,
      args.scan,
      args.show,
      args.report
    );
  }
}

// Run the script if executed directly
if (require.main === module) {
  main().catch((error) => {
    err('Unexpected error:', error.message);
    process.exit(1);
  });
}