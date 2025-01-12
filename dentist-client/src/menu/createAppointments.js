import mqttUtils from 'shared-mqtt'
const { MQTT_TOPICS } = mqttUtils;
import inquirer from "inquirer";
import { mqttRequestResponse } from '../util/mqttRequest.js';
import { getActiveUserClinicId, getActiveUserClinicName, getActiveUserId } from '../util/userState.js';

// Main menu after login
export const createAppointments = async () => {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'startTime',
            message: 'Enter the starting date and time (YYYY-MM-DDTHH:mm): ',
            validate: input => {
                const isValidIsoDate = (dateString) => {
                    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
                    return isoDateRegex.test(dateString);
                };
                return isValidIsoDate(input) || 'Invalid date format. Use YYYY-MM-DDTHH:mm';
            }
        },
        {
            type: 'input',
            name: 'endTime',
            message: 'Enter the ending date and time (YYYY-MM-DDTHH:mm): ',
            validate: input => {
                const isValidIsoDate = (dateString) => {
                    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
                    return isoDateRegex.test(dateString);
                };
                return isValidIsoDate(input) || 'Invalid date format. Use YYYY-MM-DDTHH:mm';
            }
        },
        {
            type: 'input',
            name: 'duration',
            message: 'Enter the duration of each appointment slot in minutes: ',
            validate: input => {
                const duration = parseInt(input, 10);
                return (!isNaN(duration) && duration > 0) || 'Duration must be a positive number';
            }
        },
    ]);

    const formattedStartTime = `${answers.startTime}:00.000Z`;
    const formattedEndTime = `${answers.endTime}:00.000Z`;

    const payload = {
        clinicName: getActiveUserClinicName(),
        clinicId: getActiveUserClinicId(),
        dentistId: getActiveUserId(),
        startTime: formattedStartTime,
        endTime: formattedEndTime,
        duration: parseInt(answers.duration, 10),
    };

    try {
        const response = await mqttRequestResponse(payload, MQTT_TOPICS.APPOINTMENT.CREATE);
        if (response.status.code !== 200) {
            console.log('\n', response.status.message, '\n');
            return;
        }
        console.log('\nAppointment slots created successfully\n');
    } catch (error) {
        console.error('Error while creating appointments: ', error);
    }
};

