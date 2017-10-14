import inquirer from 'inquirer';
import { exec } from 'shelljs';
import { Log } from '../utils';


function resetMeteor() {
  Log.info('\nResetting the database...');
  const { code } = exec('meteor reset');

  if (code !== 0) {
    Log.error('Database reset failed');
    process.exit(1);
  }

  Log.success('Done!');
}

function resetNpm() {
  Log.info('\nDeleting node_modules...');
  exec('find . -name \"node_modules\" -exec rm -rf \'{}\' +');
  Log.success('Done!\n');
}

export function reset(yargs) {
  Log.args(yargs.argv);

  const args = yargs.argv;

  if (args.y) {
    resetMeteor();
    resetNpm();
  } else if (args.n) {
    resetMeteor();
  } else {
    inquirer.prompt([{
      type: 'confirm',
      name: 'reset',
      message: '\nResetting the database! Also delete node_modules?',
      default: false
    }]).then((answers) => {
      resetMeteor();
      if (answers.reset) {
        resetNpm();
      }
    });
  }
}
