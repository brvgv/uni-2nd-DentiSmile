import mqttUtils from 'shared-mqtt'
const { MQTT_TOPICS } = mqttUtils;
import inquirer from "inquirer";
import { mqttRequestResponse } from '../util/mqttRequest.js';
import Table from 'cli-table3';
import chalk from 'chalk';
import { mainMenu } from "./mainMenu.js";

// Main menu after login
export const cancelOrRemoveAppointment = async () => {
    const selectedMenu = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Select an action:',
            choices: [
                'Cancel an appointment',
                'Remove an appointment'
            ]
        },
    ]);

    const action = await inquirer.prompt([
        {
            type: 'input',
            name: 'appointmentId',
            message: 'Enter the appointment id:'
        },
    ]);

    let confirm = { confirmed: false };

    await mqttRequestResponse({ appointmentId: action.appointmentId }, MQTT_TOPICS.APPOINTMENT.RETRIEVE.ONE)
        .then(async (response) => {
            if (response.status.code === 200) {
                printAppointment(response.data);
                confirm = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'confirmed',
                        message: 'Are you sure?'
                    },
                ]);
            } else {
                console.log(chalk.red('Error fetching appointment: ', response.status.message));
                await mainMenu();
            }
        }).catch(async (error) => {
            console.error('Error fetching appointment:', error);
            await mainMenu();
        });

    if (confirm.confirmed) {
        switch (selectedMenu.action) {
            case 'Cancel an appointment':
                await cancelAppointment(action.appointmentId);
                break;
            case 'Remove an appointment':
                await removeAppointment(action.appointmentId);
                break;
            default:
                console.log('\nInvalid action\n');
                break;
        }
    } else {
        console.log('\nReturning back to main menu\n');
    }
};

const printAppointment = (appointment) => {
    const table = new Table({
        head: ['Patient ID', 'Start Time', 'End Time', 'Status'],
        colWidths: [20, 10, 10, 15]
    });

    let statusColor;
    switch (appointment.status) {
        case 'booked':
            statusColor = chalk.green;
            break;
        case 'canceled':
            statusColor = chalk.red;
            break;
        case 'available':
        default:
            statusColor = chalk.blue;
            break;
    }
    const patientId = statusColor(appointment.patientId || 'N/A');
    const startTime = statusColor(new Date(appointment.startTime).toLocaleTimeString());
    const endTime = statusColor(new Date(appointment.endTime).toLocaleTimeString());
    const status = statusColor(appointment.status);

    table.push([patientId, startTime, endTime, status]);
    console.log(table.toString());
}

const cancelAppointment = async (appointmentId) => {
    await mqttRequestResponse({ "appointmentId": appointmentId }, MQTT_TOPICS.APPOINTMENT.CANCEL).then((response) => {
        if (response.status.code === 200) {
            console.log(chalk.green('Appointment cancelled successfully'));
        } else {
            console.log(chalk.red('Error cancelling appointment: ', response.status.message));
        }
    }).catch((error) => {
        console.error('Error during appointment cancellation: ', error);
    });
};

const removeAppointment = async (appointmentId) => {
    await mqttRequestResponse({ "appointmentId": appointmentId }, MQTT_TOPICS.APPOINTMENT.DELETE).then((response) => {
        if (response.status.code === 200) {
            console.log(chalk.green('Appointment removed successfully'));
        } else {
            console.log(chalk.red('Error removing appointment: ', response.status.message));
        }
    }).catch((error) => {
        console.error('Error during appointment removal: ', error);
    });
};