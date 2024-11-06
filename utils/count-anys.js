/**
 * Node script to count the occurrences of 'any' casts in the Highcharts repo.
 *
 * Usage:
 * - node utils/count-anys
 * - Copy the results into https://jsfiddle.net/highcharts/osndwv1z/ for viz
 */

const simpleGit = require('simple-git');
const semver = require('semver');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the local Highcharts repo
const REPO_PATH = path.join(__dirname, '../../highcharts');

// Initialize git object
const git = simpleGit(REPO_PATH);

// Function to count occurrences of 'any' casts using grep
function countAnyCasts() {
  try {
    // Use grep to search for 'any' casts in TypeScript files
    const result = execSync(`grep -R -E ': any|as any|:any' ./ts --include='*.ts' | wc -l`, {
      cwd: REPO_PATH,
    }).toString();
    return parseInt(result.trim(), 10);
  } catch (error) {
    console.error('Error during grep:', error.message);
    return 0;
  }
}

(async function run() {
  try {
    // Fetch all tags
    const tags = await git.tags();
    const tagResults = [];

    // Iterate over each tag
    for (const tag of tags.all) {
      // Filter only valid semver tags
      if (semver.valid(tag) && semver.gte(tag, '7.0.0')) {
        console.log(`Checking out tag: ${tag}`);
        await git.checkout(tag, ['-f']);

        // Count occurrences of 'any' casts in the current tag
        const occurrences = countAnyCasts();
        console.log(`Tag: ${tag}, any casts: ${occurrences}`);

        // Find the date of the tag
        const datetime = await git.raw(['show', '-s', '--format=%ci', tag]);
        // Extract the YYYY-MM-DD part using regex
        const date = datetime.match(/\d{4}-\d{2}-\d{2}/)[0];

        // Push the result as a tuple [tag, occurrences]
        tagResults.push([date, occurrences, tag]);
      }
    }

    // Print the final results
    console.log('Final results:');
    console.log(tagResults);

    // Optionally, save the results to a file
    const outputPath = path.join(__dirname, '../temp/any-casts-results.json');
    fs.writeFileSync(
        outputPath,
        JSON.stringify(tagResults, null, 2)
    );
    console.log(`Results saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error during process:', error);
  }
})();