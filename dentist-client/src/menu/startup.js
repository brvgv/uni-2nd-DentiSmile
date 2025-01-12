import inquirer from 'inquirer'
import { exitSequence } from '../util/disconnect.js';
import { login } from './login.js';

export const startupScreen = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Welcome to the Dentist CLI Tool!',
      choices: ['Login', 'Exit'],
    },
  ]);

  if (action === 'Login') {
    await login();
  } else if (action === 'Exit') {
    exitSequence();
  }
};


