function startApp() {

    // Attaching event handlers
    (() => {
        $('#formLogin').submit(loginUser);
        $('#formRegister').submit(registerUser);
        $('#linkMenuLogout').click(logoutUser);

        $('#linkUserHomeMyMessages').click(loadMyMessages);
        $('#linkMenuMyMessages').click(loadMyMessages);

        // $('#linkUserHomeArchiveSent').click(loadArchivedMessages);
        // $('#linkMenuArchiveSent').click(loadArchivedMessages);

        $('#formSendMessage').submit(sendMessage);

        $('#linkMenuUserHome').click(userLoggedIn);
        $('#linkMenuAppHome').click(userLoggedOut);

        $('#linkMenuRegister').click(() => showView('Register'));
        $('#linkMenuLogin').click(() => showView('Login'));
        // $('#linkUserHomeSendMessage').click(loadSendMessage);
        // $('#linkMenuSendMessage').click(loadSendMessage);

    })();

    if (sessionStorage.getItem('authtoken') === null) {
        userLoggedOut();
    } else {
        userLoggedIn();
    }

    // LOGIC TO LOGOUT USER
    function logoutUser() {
        auth.logout()
            .then(() => {
                sessionStorage.clear();
                showInfo('Logout successful.');
                userLoggedOut();
            }).catch(handleError);
    }

    // LOGIC TO LOGIN USER
    function loginUser(ev) {
        ev.preventDefault();
        let inputUsername = $('#loginUsername');
        let inputPassword = $('#loginPasswd');

        let usernameVal = inputUsername.val();
        let passwdVal = inputPassword.val();

        auth.login(usernameVal, passwdVal)
            .then((userInfo) => {
                saveSession(userInfo);
                inputUsername.val('');
                inputPassword.val('');
                showInfo('Login successful.');
            }).catch(handleError);
    }

    // LOGIC TO REGISTER USER
    function registerUser(ev) {
        ev.preventDefault();
        let registerUsername = $('#registerUsername');
        let registerName = $('#registerName');
        let registerPassword = $('#registerPasswd');

        let usernameVal = registerUsername.val();
        let nameVal = registerName.val();
        let passVal = registerPassword.val();

        auth.register(usernameVal, passVal, nameVal)
            .then((userInfo) => {
                saveSession(userInfo);
                registerUsername.val("");
                registerName.val("");
                registerPassword.val("");
                showInfo('User registration successful.');
            }).catch(handleError);
    }

    // function navigateTo() {
    //     let viewName = $(this).attr('data-target');
    //     showView(viewName);
    // }

    // Shows one view/section at a time
    function showView(viewName) {
        $('main > section').hide();
        $('#view' + viewName).show();
    }

    function userLoggedOut() {
        $('.anonymous').show();
        $('.useronly').hide();
        $('#spanMenuLoggedInUser').text('');
        showView('AppHome');
    }

    function userLoggedIn() {
        $('.anonymous').hide();
        $('.useronly').show();
        let username = sessionStorage.getItem('username');
        $('#spanMenuLoggedInUser').text(`Welcome, ${username}!`);
        $('#viewUserHomeHeading').text(`Welcome, ${username}!`);
        showView('UserHome');
    }

    function saveSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authtoken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('name', userInfo['name']);
        userLoggedIn();
    }

    function handleError(reason) {
        showError(reason.responseJSON.description);
    }

    function showInfo(message) {
        let infoBox = $('#infoBox');
        infoBox.text(message);
        infoBox.show();
        setTimeout(() => infoBox.fadeOut(), 3000);
    }

    function showError(message) {
        let errorBox = $('#errorBox');
        errorBox.text(message);
        errorBox.show();
        setTimeout(() => errorBox.fadeOut(), 3000);
    }
}