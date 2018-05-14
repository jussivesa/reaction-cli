import os from 'os';
import inquirer from 'inquirer';
import { Config, GraphQL, Log, generateKeyPair, exists } from '../utils';
import appsList from './apps/list';
import keysList from './keys/list';
import keyCreate from './keys/add';


const helpMessage = `
Usage:

  reaction login [options]

    Options:
      --user    Your Reaction username
      --pass    Your Reaction password
`;


function doLogin(user, pass) {
  const gql = new GraphQL();

  gql.login({ username: user, password: pass })
    .then(async (res) => {
      if (!!res.errors) {
        res.errors.forEach((err) => {
          Log.error(err.message);
        });
        process.exit(1);
      }

      const { user: { _id, email }, token, tokenExpires } = res.data.loginWithPassword;

      Config.set('global', 'launchdock', { _id, username: user, email, token, tokenExpires });

      await appsList();

      const keys = await keysList();
      const homeDir = os.homedir();

      let hasKey = false;

      keys.forEach((k) => {
        if (exists(`${homeDir}/.reaction/keys/${k.title}`)) {
          hasKey = true;
        }
      });

      if (keys.length === 0 || !hasKey) {
        const keyPair = generateKeyPair({ email });
        await keyCreate({ publicKey: keyPair.publicKey, title: keyPair.title });
      }

      Log.success(`\nLogged in as ${user}\n`);
    })
    .catch((e) => Log.error(e));
}


export function login(yargs) {
  Log.args(yargs.argv);

  const args = yargs.argv;

  if (args.help) {
    return Log.default(helpMessage);
  }

  if (args.user && args.pass) {
    return doLogin(args.user, args.pass);
  }

  inquirer.prompt([{
    type: 'input',
    name: 'username',
    message: 'Username:'
  }, {
    type: 'password',
    name: 'password',
    message: 'Password:'
  }]).then((answers) => {
    const { username, password } = answers;
    doLogin(username, password);
  });
}
