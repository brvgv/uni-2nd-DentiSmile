let loggedIn = false;
let activeUserId = null;
let activeUserToken = null;
let activeUserClinicName = 'Göteborg Dental Clinic';
let activeUserClinicId = '64b8f9f1f1a4c8b1a1a1a1a1';

export const signInUser = (userLoginData) => {
    loggedIn = true;
    activeUserId = userLoginData.userId;
    activeUserToken = userLoginData.token;
}

export const signOutUser = () => {
    loggedIn = false;
    activeUserId = null;
    activeUserToken = null;
}

export const isLoggedIn = () => loggedIn;
export const getActiveUserId = () => activeUserId;
export const getActiveUserToken = () => activeUserToken;
export const getActiveUserClinicName = () => activeUserClinicName;
export const getActiveUserClinicId = () => activeUserClinicId;