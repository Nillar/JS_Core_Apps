function startApp() {
    console.log('hi');

    $(document).on({
        ajaxStart: () => $('#loadingBox span').show(),
        ajaxStop: () => $('#loadingBox span').fadeOut()
    });
    $('#infoBox').click((event) => $(event.target).hide());
    $('#errorBox').click((event) => $(event.target).hide());
    // Attaching event handlers
    (() => {
        $('#formLogin').submit(loginUser);
        $('#formRegister').submit(registerUser);
        $('#formSubmitChirp').submit(createChirp);
        $('#formSubmitChirpMy').submit(createMyChirp);

        $('#logoutLink').click(logoutUser);
        $('#homeLink').click(userLoggedIn);
        $('#meLink').click(myChirps);
        $('#discoverLink').click(discoverUsers);

        // $('a#deleteLink').click(deleteChirp);


        $('#linkMenuUserHome').click(userLoggedIn);
        $('#linkMenuAppHome').click(userLoggedOut);

        $('#linkMenuRegister').click(() => showView('Register'));
        $('#linkMenuLogin').click(() => showView('Login'));
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
        let form = $('#formLogin');
        let inputUsername = form.find('input[name="username"]');
        let inputPassword = form.find('input[name="password"]');

        let usernameVal = inputUsername.val();
        let passwordVal = inputPassword.val();

        auth.login(usernameVal, passwordVal)
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
        let form = $('#formRegister');
        let registerUsername = form.find('input[name="username"]');
        let registerPassword = form.find('input[name="password"]');
        let repeatPassword = form.find('input[name="repeatPass"]');

        let usernameVal = registerUsername.val();
        let passVal = registerPassword.val();
        let repeatPassVal = repeatPassword.val();
        let subscriptions = [];
        console.log(subscriptions);

        let usernameRegex = /^[A-Za-z0-9]{5,}$/;
        let passwordRegex = /^[A-Za-z0-9]{1,}$/;

        if (!usernameRegex.test(usernameVal)) {
            showError('The username should be at least 5 characters long.');

            return;
        }

        if (!passwordRegex.test(repeatPassVal)) {
            showError('The password should be at least 1 character long.');

            return;
        }

        if (repeatPassVal !== undefined && passVal !== repeatPassVal) {
            showError('Both passwords should match.');

            return;
        }

        auth.register(usernameVal, passVal, [])
            .then((userInfo) => {
                saveSession(userInfo);
                registerUsername.val("");
                repeatPassword.val("");
                registerPassword.val("");
                showInfo('User registration successful.');
            }).catch(handleError);
    }

    // Shows one view/section at a time
    function showView(viewName) {
        $('main > section').hide();
        $('#view' + viewName).show();
    }

    function userLoggedOut() {
        $('section').hide();
        $('.menu').hide();
        $('#viewLogin').show();
        $('#linkRegister').click(showRegisterForm);
        $('#linkLogin').click(showLoginForm);

        function showRegisterForm() {
            $('#viewLogin').hide();
            $('#viewRegister').show();
        }

        function showLoginForm() {
            $('#viewLogin').show();
            $('#viewRegister').hide();
        }

    }

    function userLoggedIn() {
        $('section').hide();
        $('.menu').show();
        $('#viewFeed').show();
        viewFeed();
        let username = sessionStorage.getItem('username');
        $('#spanMenuLoggedInUser').text(`Welcome, ${username}!`);
        $('#viewUserHomeHeading').text(`Welcome, ${username}!`);
        // showView('UserHome');
    }

    // SAVE SESSION
    function saveSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        let subscriptions = userInfo.subscriptions || [];
        console.log(userInfo.subscriptions);
        sessionStorage.setItem('authtoken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
        let username = userInfo.username;
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('name', userInfo['name']);
        sessionStorage.setItem('subscriptions', subscriptions);

        userLoggedIn();
    }

    // ERRORS AND NOTIFICATIONS
    function handleError(reason) {
        showError(reason.responseJSON.description);
    }

    function showInfo(message) {
        $('#infoBox span').text(message);
        $('#infoBox').show();
        setTimeout(() => $('#infoBox').fadeOut(), 3000);
    }

    function showError(message) {
        $('#errorBox span').text(message);
        $('#errorBox').show();
        setTimeout(() => $('#errorBox').fadeOut(), 3000);
    }

    // HELPER FUNCTION CALCTIME
    function calcTime(dateIsoFormat) {
        let diff = new Date - (new Date(dateIsoFormat));
        diff = Math.floor(diff / 60000);
        if (diff < 1) return 'less than a minute';
        if (diff < 60) return diff + ' minute' + pluralize(diff);
        diff = Math.floor(diff / 60);
        if (diff < 24) return diff + ' hour' + pluralize(diff);
        diff = Math.floor(diff / 24);
        if (diff < 30) return diff + ' day' + pluralize(diff);
        diff = Math.floor(diff / 30);
        if (diff < 12) return diff + ' month' + pluralize(diff);
        diff = Math.floor(diff / 12);
        return diff + ' year' + pluralize(diff);

        function pluralize(value) {
            if (value !== 1) return 's';
            else return '';
        }
    }

    // VIEW FEED
    async function viewFeed() {
        let chirps = $('#chirps.chirps');
        let userStats = $('#userStats span');
        userStats.empty();
        chirps.empty();
        let username = sessionStorage.getItem('username');
        $('#currentUser').text(username);

        let clicks = 0;
        let endpointUserChirps = `chirps?query={"author": "${username}"}`;
        let endpointFollowingCount = sessionStorage.getItem('subscriptions'); // Kiril98,Softuni
        let endpointFollowersCount = `?query={"subscriptions":"${username}"}`;
        console.log(endpointFollowingCount.length);


        if (endpointFollowingCount === '') {

        }
        else {
            endpointFollowingCount = endpointFollowingCount.split(',');
        }

        let userChirps = await requester.get('appdata', endpointUserChirps, 'kinvey');
        let followersCount = await requester.get('user', endpointFollowersCount, 'kinvey');

        // USER STATS
        $('#chirpsCount').text(`${userChirps.length} chirps`);
        $('#followingCount').text(`${endpointFollowingCount.length} following`);
        $('#followersCount').text(`${followersCount.length} followers`);


        // CHIRPS BY OTHER USERS
        let subsArray = [];
        for (let i = 0; i < endpointFollowingCount.length; i++) {
            subsArray.push(endpointFollowingCount[i]);
        }

        let endpoint = `chirps?query={"author":{"$in": [${subsArray.map(e => `"${e}"`)}]}}&sort={"_kmd.ect": 1}`;
        let chirpsByOtherUsers = await requester.get('appdata', endpoint, 'kinvey');

        let html = `<h2 class="titlebar">Chirps</h2>`;
        for (let chirp of chirpsByOtherUsers) {
            clicks++;

            html += `<article class="chirp"></article><div class="titlebar">
                        <a href="#" class="chirp-author">${chirp.author}</a>
                        <span class="chirp-time">${calcTime(chirp._kmd.ect)}</span>
                    </div>
                    <p>${chirp.text}</p></article>`
        }
        let noChirps = $('<div id="chirps" class="chirps"><h2 class="titlebar">Chirps</h2><p>No chirps in database</p>');

        if (clicks === 0) {
            chirps.append(noChirps);
            return;
        }

        chirps.append($(`${html}`));

    }

    // CREATE CHIRP
    async function createChirp(ev) {
        ev.preventDefault();
        let form = $('#formSubmitChirp');
        let text = form.find('textarea[name="text"]').val();
        let author = sessionStorage.getItem('username');


        if (text.length === 0) {
            showError('Text cannot be empty');
            return;
        }
        if (text.length > 150) {
            showError('Text is over 150 symbols');
            return;
        }

        let newChirp = {
            text: text,
            author: author
        };

        try {
            await requester.post('appdata', 'chirps', 'kinvey', newChirp);
            showInfo('Chirp created.');
            myChirps();
            form.find('textarea[name="text"]').val('');
        } catch (err) {
            handleError(err);
        }
    }

    //CREATE MY CHIRP
    async function createMyChirp(ev) {
        ev.preventDefault();
        let form = $('#formSubmitChirpMy');
        let text = form.find('textarea[name="text"]').val();
        let author = sessionStorage.getItem('username');


        if (text.length === 0) {
            showError('Text cannot be empty');
            return;
        }
        if (text.length > 150) {
            showError('Text is over 150 symbols');
            return;
        }

        let newChirp = {
            text: text,
            author: author
        };

        try {
            await requester.post('appdata', 'chirps', 'kinvey', newChirp);
            showInfo('Chirp created.');
            myChirps();
            form.find('textarea[name="text"]').val('');
        } catch (err) {
            handleError(err);
        }
    }

    // VIEW MY CHIRPS
    async function myChirps() {
        $('section').hide();
        $('#viewMe').show();
        let chirps = $('#myChirps.chirps');
        let userStats = $('#myStats span');
        userStats.empty();
        chirps.empty();
        let username = sessionStorage.getItem('username');
        $('#myName').text(username);
        let clicks = 0;

        let endpointUserChirps = `chirps?query={"author": "${username}"}`;
        let endpointFollowingCount = sessionStorage.getItem('subscriptions'); // Kiril98,Softuni
        let endpointFollowersCount = `?query={"subscriptions":"${username}"}`;

        if (endpointFollowingCount === '') {

        }
        else {
            endpointFollowingCount = endpointFollowingCount.split(',');
        }

        let userChirps = await requester.get('appdata', endpointUserChirps, 'kinvey');
        let followersCount = await requester.get('user', endpointFollowersCount, 'kinvey');

        // USER STATS
        $('#myChirpsCount').text(`${userChirps.length} chirps`);
        $('#myFollowingCount').text(`${endpointFollowingCount.length} following`);
        $('#myFollowersCount').text(`${followersCount.length} followers`);


        // MY CHIRPS
        // let subsArray = [];
        // for (let i = 0; i < endpointFollowingCount.length; i++) {
        //     subsArray.push(endpointFollowingCount[i]);
        // }

        let endpoint = `chirps?query={"author":"${username}"}&sort={"_kmd.ect": -1}`;
        let myChirps = await requester.get('appdata', endpoint, 'kinvey');

        let html = `<h2 class="titlebar">Chirps</h2>`;
        for (let chirp of myChirps) {
            clicks++;

            html += `<article class="chirp"><div class="titlebar">
                        <a href="#" class="chirp-author">${chirp.author}</a>
                        <span class="chirp-time"><a href="#" id="deleteLink" data-target="${chirp._id}">delete </a>${calcTime(chirp._kmd.ect)}</span>
                    </div>
                    <p>${chirp.text}</p></article>`;



            // $('a#btnDeleteComment.deleteLink').click(() => deleteComment(comments[i]._id, data._id));
        }

        // $('a#deleteLink').click(() => deleteChirp(chirp._id, data._id));
        let noChirps = $('<div id="myChirps" class="chirps">\n' +
            '                <h2 class="titlebar">Chirps</h2><p>No chirps in database</p>');

        if (clicks === 0) {
            chirps.append(noChirps);
            return;
        }

        chirps.append($(`${html}`));
        $('a#deleteLink').click(deleteChirp);

    }
    //DELETING CHIRP
    async function deleteChirp() {
        let messageId = $(this).attr('data-target');
        console.log(messageId);

        try {
            await requester.remove('appdata', 'chirps/' + messageId, 'kinvey');
            showInfo('Chirp deleted');

            myChirps();

        } catch (err) {
            handleError(err);
        }
    }

    async function discoverUsers() {
        $('section').hide();
        $('#viewProfile').show();
    }
}