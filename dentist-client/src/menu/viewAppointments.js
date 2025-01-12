import chalk from 'chalk';
import inquirer from 'inquirer';
import { mqttRequestResponse } from '../util/mqttRequest.js';
import mqttUtils from 'shared-mqtt'
import Table from 'cli-table3';
import { getActiveUserId } from '../util/userState.js';
import { DateTime } from 'luxon';

const { MQTT_TOPICS } = mqttUtils;
let appointments = [];
let appointmentsByDay = {};
let answers;

// Function to view appointments
export const viewAppointments = async () => {

    let action;

    do {
        answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'startingDate',
                message: 'Enter the starting date (YYYY-MM-DD): ',
                validate: validateDate
            },
            {
                type: 'input',
                name: 'endingDate',
                message: 'Enter the ending date (YYYY-MM-DD): ',
                validate: validateDate
            }
        ]);

        await displayAppointments();

        action = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Choose an option:',
                choices: ['Select timeframe', 'Exit'],
            },
        ]);

    } while (action?.action !== 'Exit');
};

function validateDate(input) {
    const date = DateTime.fromFormat(input, 'yyyy-MM-dd');
    if (!date.isValid) {
        return 'Invalid date format. Please use YYYY-MM-DD';
    }
    return true;
}

// Displays appointments by retrieving them from the server, mapping them by day, and printing them as a table
const displayAppointments = async () => {
    try {
        await retrieveAppointments(answers.startingDate, answers.endingDate);
        mapAppointmentsByDay();
        appointmentTable();
    } catch (error) {
        console.error('Error loading appointments page:', error);
    }
}

// Fetches appointments from the server
const retrieveAppointments = async (startingDate, endingDate) => {
    try {
        let response = await mqttRequestResponse({ dentistId: getActiveUserId(), startingDate: startingDate, endingDate: endingDate }, MQTT_TOPICS.APPOINTMENT.RETRIEVE.MANY);
        if (response.status.code === 200) {
            appointments = response.data;
            if (appointments.length < 1) {
                console.log(chalk.yellow('No appointments found for this timeframe.'));
            }
            else {
                appointments.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            }
        } else {
            console.log(chalk.red('Error fetching appointments:', response.status.message));
        }
    }
    catch (error) {
        console.error('Error while fetching appointments: ', error);
    }
}

// Maps appointments by day
const mapAppointmentsByDay = () => {
    appointmentsByDay = {};
    appointments.forEach(appointment => {
        const dateKey = new Date(appointment.startTime).toDateString();
        if (!appointmentsByDay[dateKey]) {
            appointmentsByDay[dateKey] = [];
        }
        appointmentsByDay[dateKey].push(appointment);
    });
}

// Prints appointments as a table
const appointmentTable = () => {
    for (const date in appointmentsByDay) {
        console.log(chalk.yellow(`\nAppointments for ${date}:`));
        let table = new Table({
            head: ['Patient ID', 'Start Time', 'End Time', 'Status', 'Appointment ID'],
            colWidths: [20, 10, 10, 15, 26]
        });

        appointmentsByDay[date].forEach(appointment => {
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
            const appointmentId = statusColor(appointment._id)
            table.push([patientId, startTime, endTime, status, appointmentId]);
        });
        console.log(table.toString());
    }
}