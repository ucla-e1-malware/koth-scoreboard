#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const crypto = require('crypto');
const path = require('path');

/**
 * Generate a flag in the format e1{32_random_hex_digits}
 * @returns {string} Generated flag
 */
function generateFlag() {
    const randomHex = crypto.randomBytes(16).toString('hex'); // 16 bytes = 32 hex chars
    return `e1{${randomHex}}`;
}

/**
 * Main function to generate flags and update config.yaml
 * @param {number} count Number of flags to generate
 * @param {number} pointValue Point value for each flag (default: 10)
 */
function generateFlags(count, pointValue = 10) {
    const configPath = path.join(__dirname, 'config.yaml');
    
    // Check if config.yaml exists
    if (!fs.existsSync(configPath)) {
        console.error('Error: config.yaml not found. Please copy config.yaml.example to config.yaml first.');
        process.exit(1);
    }
    
    try {
        // Read and parse existing config
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = yaml.load(configContent);
        
        // Initialize valid_flags if it doesn't exist
        if (!config.valid_flags) {
            config.valid_flags = {};
        }
        
        console.log(`Generating ${count} new flags (${pointValue} points each)...`);
        
        // Generate new flags
        const newFlags = [];
        for (let i = 0; i < count; i++) {
            let flag;
            // Ensure flag is unique
            do {
                flag = generateFlag();
            } while (config.valid_flags[flag]);
            
            config.valid_flags[flag] = pointValue;
            newFlags.push(flag);
        }
        
        // Write updated config back to file
        const updatedYaml = yaml.dump(config, {
            lineWidth: -1, // Don't wrap long lines
            noRefs: true,  // Don't use references
            sortKeys: false // Maintain order
        });
        
        fs.writeFileSync(configPath, updatedYaml, 'utf8');
        
        console.log('✅ Successfully generated and added flags to config.yaml:');
        newFlags.forEach((flag, index) => {
            console.log(`  ${index + 1}. ${flag} (${pointValue} points)`);
        });
        console.log(`\n📊 Total flags in config: ${Object.keys(config.valid_flags).length}`);
        
    } catch (error) {
        console.error('Error updating config.yaml:', error.message);
        process.exit(1);
    }
}

// Main script execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Usage: node generate-flags.js <number_of_flags> [point_value]');
        console.log('Examples:');
        console.log('  node generate-flags.js 5        # Generate 5 flags worth 10 points each');
        console.log('  node generate-flags.js 3 25     # Generate 3 flags worth 25 points each');
        process.exit(1);
    }
    
    const flagCount = parseInt(args[0], 10);
    const pointValue = args[1] ? parseInt(args[1], 10) : 10;
    
    if (isNaN(flagCount) || flagCount <= 0) {
        console.error('Error: Please provide a valid positive number of flags to generate.');
        process.exit(1);
    }
    
    if (args[1] && (isNaN(pointValue) || pointValue <= 0)) {
        console.error('Error: Please provide a valid positive point value.');
        process.exit(1);
    }
    
    if (flagCount > 1000) {
        console.warn('Warning: Generating more than 1000 flags. This might take a while...');
    }
    
    generateFlags(flagCount, pointValue);
}

module.exports = { generateFlag, generateFlags };