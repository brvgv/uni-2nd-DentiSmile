import inquirer from 'inquirer';
import { mainMenu } from './mainMenu.js';
import { mqttRequestResponse } from '../util/mqttRequest.js';
import { startupScreen } from './startup.js';
import mqttUtils from 'shared-mqtt'
import { signInUser } from '../util/userState.js';

const { MQTT_TOPICS } = mqttUtils;

// Login functionality
export const login = async () => {
  const credentials = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email:',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your password:',
      mask: '*',
    },
  ]);
  try {
    const loginResult = await mqttRequestResponse({ email: credentials.email, password: credentials.password }, MQTT_TOPICS.AUTHENTICATION.LOGIN);

    if (loginResult.status.code === 200) {
      console.log('\nLogin successful!\n');
      signInUser(loginResult.data);
      await mainMenu();
    } else {
      console.log('\nInvalid credentials. Please try again.\n');
      await startupScreen();
    }
  } catch (error) {
    console.error('\nError while logging in:', error, '\n');
    await startupScreen();
  }
};
