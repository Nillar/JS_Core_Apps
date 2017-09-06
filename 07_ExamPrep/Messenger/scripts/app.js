function startApp() {

    // Attaching event handlers
    (() => {
        $('#formLogin').submit(loginUser);
        $('#formRegister').submit(registerUser);
        $('#linkMenuLogout').click(logoutUser);

        $('#linkUserHomeMyMessages').click(loadMyMessages);
        $('#linkMenuMyMessages').click(loadMyMessages);

        $('#linkUserHomeArchiveSent').click(loadArchivedMessages);
        $('#linkMenuArchiveSent').click(loadArchivedMessages);

        $('#formSendMessage').submit(sendMessage);

        $('#linkMenuUserHome').click(userLoggedIn);
        $('#linkMenuAppHome').click(userLoggedOut);

        $('#linkMenuRegister').click(() => showView('Register'));
        $('#linkMenuLogin').click(() => showView('Login'));
        $('#linkUserHomeSendMessage').click(loadSendMessage);
        $('#linkMenuSendMessage').click(loadSendMessage);

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


    // LOAD MY MESSAGES
    async function loadMyMessages() {
        showView('MyMessages');
        let username = sessionStorage.getItem('username');
        let endpoint = `messages?query={"recipient_username":"${username}"}`;

        let data = await requester.get('appdata', endpoint, 'kinvey');
        let messagesContainer = $('#myMessages');
        messagesContainer.empty();
        let messagesTable = $('<table>');
        messagesTable.append($('<thead>')
            .append($('<tr>')
                .append('<th>From</th>')
                .append('<th>Message</th>')
                .append('<th>Date Received</th>')));
        let tableBody = $('<tbody>');

        for(let msg of data) {
            let tableRow = $('<tr>');
            let sender = formatSender(msg['sender_name'], msg['sender_username']);
            let msgText = msg['text'];
            let msgDate = formatDate(msg['_kmd']['lmt']);
            tableRow.append($('<td>').text(sender));
            tableRow.append($('<td>').text(msgText));
            tableRow.append($('<td>').text(msgDate));
            tableBody.append(tableRow);
        }

        messagesTable.append(tableBody);
        messagesContainer.append(messagesTable);
    }

    // LOAD ARCHIVE MESSAGES
    async function loadArchivedMessages() {
        showView('ArchiveSent');
        let username = sessionStorage.getItem('username');
        let endpoint = `messages?query={"sender_username":"${username}"}`;
        let data = await requester.get('appdata', endpoint, 'kinvey');

        let messagesContainer = $('#sentMessages');
        messagesContainer.empty();
        let messagesTable = $('<table>');
        messagesTable.append($('<thead>')
            .append($('<tr>')
                .append('<th>From</th>')
                .append('<th>Message</th>')
                .append('<th>Date Received</th>')));
        let tableBody = $('<tbody>');

        // console.log(data);
        for(let msg of data) {
            let tableRow = $('<tr>');
            let recipient = msg['recipient_username'];
            let msgText = msg['text'];
            let msgDate = formatDate(msg['_kmd']['lmt']);
            let deleteBtn = $(`<button value="${msg._id}">Delete</button>`)
                .click(deleteMessage);
            tableRow.append($('<td>').text(recipient));
            tableRow.append($('<td>').text(msgText));
            tableRow.append($('<td>').text(msgDate));
            tableRow.append($('<td>').append(deleteBtn));
            tableBody.append(tableRow);
        }


        messagesTable.append(tableBody);
        messagesContainer.append(messagesTable);
    }

    // DELETE MESSAGE
    async function deleteMessage() {
        let messageId = $(this).val();
        let endpoint = `messages/${messageId}`;
        try {
            await requester.remove('appdata', endpoint, 'kinvey');
            showInfo('Message deleted.');
            loadArchivedMessages();
        }
        catch(err) {
            handleError(err);
        }

    }
    
    // SEND MESSAGE
    async function loadSendMessage() {
        showView('SendMessage');
        let users = await requester.get('user', '', 'kinvey');
        let usersContainer = $('#msgRecipientUsername');
        usersContainer.empty();
        for (let user of users) {
            let username = user['username'];
            let fullName = formatSender(user['name'], username);
            if (username !== sessionStorage.getItem('username')) {
                usersContainer.append($(`<option value="${username}">${fullName}</option>`))
            }
        }
    }

    async function sendMessage(ev) {
        ev.preventDefault();
        let recipient = $('#msgRecipientUsername').val();
        let text = $('#formSendMessage #msgText').val();
        let senderUsername = sessionStorage.getItem('username');
        let senderName = sessionStorage.getItem('name');

        let newMessage = {
            "sender_username": `${senderUsername}`, "sender_name": `${senderName}`, "recipient_username": `${recipient}`, "text": `${text}`
        };

        try {
            await requester.post('appdata', 'messages', 'kinvey', newMessage);
            showInfo('Message sent.');
            $('#formSendMessage #msgText').val('');
            loadArchivedMessages();
        } catch (err) {
            handleError(err);
        }

    }

    // HELPER FUNCTIONS
    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

    function formatSender(name, username) {
        if (!name)
            return username;
        else
            return username + ' (' + name + ')';
    }


    // Handle notifications
    $(document).on({
        ajaxStart: () => $("#loadingBox").show(),
        ajaxStop: () => $('#loadingBox').fadeOut()
    });
}