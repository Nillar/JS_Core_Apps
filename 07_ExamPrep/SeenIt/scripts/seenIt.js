function startApp() {

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_rkHqs6zK-"; // APP KEY HERE
    const kinveyAppSecret = "0362fddf253c498f98f8aada81055d48"; // APP SECRET HERE

    console.log('hi');
    $('section').hide();


    // REQUESTER
    let requester = (() => {

        function makeAuth(type) {
            if (type === 'basic') {
                return 'Basic ' + btoa(kinveyAppKey + ':' + kinveyAppSecret);
            }
            else {
                return 'Kinvey ' + sessionStorage.getItem('authtoken');
            }
        }

        function makeRequest(method, module, url, auth) {
            return req = {
                url: kinveyBaseUrl + module + '/' + kinveyAppKey + '/' + url,
                method,
                headers: {
                    'Authorization': makeAuth(auth)
                }
            };
        }

        function get(module, url, auth) {
            return $.ajax(makeRequest('GET', module, url, auth));
        }

        function post(module, url, data, auth) {
            let req = makeRequest('POST', module, url, auth);
            console.log(auth);
            req.data = JSON.stringify(data);
            req.headers['Content-Type'] = 'application/json';
            return $.ajax(req);
        }

        function update(module, url, data, auth) {
            let req = makeRequest('PUT', module, url, auth);
            req.data = JSON.stringify(data);
            req.headers['Content-Type'] = 'application/json';
            return $.ajax(req);
        }

        function remove(module, url, auth) {
            return $.ajax(makeRequest('DELETE', module, url, auth));
        }

        return {
            get, post, update, remove
        }
    })();

    function showView(view) {
        $('section').hide();
        switch (view) {
            case 'catalog':
                $('#viewCatalog').show();
                listPosts();
                break;
            case 'createPost':
                $('#viewSubmit').show();
                break;
        }
    }

    // Notifications
    $(document).on({
        ajaxStart: () => $('#loadingBox').show(),
        ajaxStop: () => $('#loadingBox').fadeOut()
    });
    $('#infoBox').click((event) => $(event.target).hide());
    $('#errorBox').click((event) => $(event.target).hide());

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

    // ATTACHING EVENT HANDLERS
    $('#logoutLink').click(logoutUser);
    $('#btnRegister').click(registerUser);
    $('#btnLogin').click(loginUser);
    $('#submitLink').click(() => (showView('createPost')));
    $('#myPosts').click(showView('myPosts'));
    $('#catalog').click(() => (showView('catalog')));

    $('#btnSubmitPost').click(createPost);
    // LOGGED IN OR LOGGED OUT CHECK
    if (sessionStorage.getItem('authtoken') === null) {
        userLoggedOut();
    }
    else {
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
        let form = $('#loginForm');
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
        let form = $('#registerForm');
        let inputUsername = form.find('input[name="username"]');
        let inputPassword = form.find('input[name="password"]');
        let repeatPassword = form.find('input[name="repeatPass"]');

        let usernameVal = inputUsername.val();
        let passwordVal = inputPassword.val();
        let repeatPasswordVal = repeatPassword.val();

        let usernameRegex = /^[A-Za-z]{3,}$/;
        let passwordRegex = /^[A-Za-z0-9]{6,}$/;

        if (!usernameRegex.test(usernameVal)) {
            showError('The username should be at least 3 characters long and should contain only english alphabet letters.');

            return;
        }

        if (!passwordRegex.test(passwordVal)) {
            showError('The password should be at least 6 characters long and should contain only english alphabet letters and digits.');

            return;
        }

        if (repeatPasswordVal !== undefined && passwordVal !== repeatPasswordVal) {
            showError('Both passwords should match.');

            return;
        }

        auth.register(usernameVal, passwordVal)
            .then((userInfo) => {
                saveSession(userInfo);
                inputUsername.val("");
                inputPassword.val("");
                showInfo('User registration successful.');
            }).catch(handleError);

    }

    function userLoggedIn() {
        $('section').hide();
        $('#viewCatalog').show();
        $('#profile').show();
        $('#menu').show();
        let username = sessionStorage.getItem('username');
        $('#profile span').text(`${username}`);
        $('#infoBox span').text(`Login successful.`);
        listPosts();
    }

    function userLoggedOut() {
        $('section').hide();
        $('#viewWelcome').show();
        $('#profile').hide();
        $('#menu').hide();
        $('#infoBox span').text(`Logout successful.`);
    }

    // SAVING SESSION
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

    // ERROR HANDLING
    function handleError(reason) {
        showError(reason.responseJSON.description);
    }


    // LISTING ALL POSTS
    async function listPosts() {
        $('section').hide();
        $('#viewCatalog').show();
        let data = await requester.get('appdata', 'posts');
        $('#viewCatalog div.posts').empty();

        if (data.length === 0) {
            return $('.posts').append('<p>No posts in database</p>');
        }

        for (let i = 0; i < data.length; i++) {
            console.log('posts');
            let article = $('<article class="post">');
            let colRank = $('<div class="col rank">');
            let colThumbnail = $('<div class="col thumbnail">');
            let postContent = $('<div class="post-content">');

            let comments = $(`<a class="commentsLink" href="#">comments</a>`).click(() => detailPost(data[i]._id));
            let edit = $(`<a class="editLink" href="#" data-target="Edit">edit</a>`).click(() => editPost(data[i]._id));
            let deleteP = $(`<a class="deleteLink" href="#">delete</a>`).click(() => deletePost(data[i]._id));

            let actionLi = $('<li class="action">');
            colRank.append($(`<span>${i + 1}</span>`));
            article.append(colRank);
            colThumbnail.append($(`<a href="${data[i].url}"><img src="${data[i].imageUrl}"></a>`));
            article.append(colThumbnail);

            postContent.append($(`<div class="title">`).append(`<a href="${data[i].url}">${data[i].title}</a>`));
            postContent.append($(`<div class="details>">`)
                .append($(`<div class="info">submitted ${calcTime(data[i]._kmd.ect)} ago by ${data[i].author}</div>`))
                .append($(`<div class="controls">`)
                    .append($('<ul>')
                        .append($(actionLi)
                        ))));
            actionLi.append(comments);

            if (data[i]._acl.creator === sessionStorage.getItem('userId')) {
                actionLi.append(edit);
                actionLi.append(deleteP)
            }

            article.append(postContent);
            $('.posts').append(article);
        }


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

    }

    //LISTING MY POSTS
    async function listMyPosts() {
        $('section').hide();
        $('#viewCatalog').show();
        // console.log('my posts');
    }

    // CREATE POST
    async function createPost(ev) {
        ev.preventDefault();
        let form = $('#submitForm');
        let url = form.find('input[name="url"]').val();
        let title = form.find('input[name="title"]').val();
        let imageUrl = form.find('input[name="image"]').val();
        let description = form.find('textarea[name="comment"]').val();
        let author = sessionStorage.getItem('username');
        // console.log(title.length);

        if (form.find('input[name="title"]').val().length === 0) {
            showError('Title cannot be empty');
            return;
        }
        if (url.slice(0, 4) !== 'http') {
            showError('Link is incorrect');
            return;
        }

        let newPost = {
            url, title, imageUrl, description, author
        };

        try {
            await requester.post('appdata', 'posts', newPost);
            showInfo('Post created.');
            showView('catalog');
            form.find('input[name="url"]').val('');
            form.find('input[name="title"]').val('');
            form.find('input[name="image"]').val('');
            form.find('textarea[name="comment"]').val('');
        } catch (err) {
            handleError(err);
        }
    }

    //EDITING POSTS
    function editPost() {

    }

    //DELETING POSTS
    function deletePost() {

    }

    function detailPost() {
        console.log('viewDetails');
    }

}