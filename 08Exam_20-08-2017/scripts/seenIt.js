function startApp() {
    // console.log('hello');
    const baseUrl = "https://baas.kinvey.com/";
    const appKey = "kid_HJwmsWwdZ";
    const appSecret = "a4c6eee7285f4d32844612b930bd5163";

    // SHOWVIEW ON LOAD
    $('section').hide();
    if (sessionStorage.getItem('authtoken') !== null &&
        sessionStorage.getItem('username') !== null) {
        // showView('catalog');
        userLoggedIn();
    } else {
        userLoggedOut();
        // showView('home');
    }

    // SHOWVIEWS
    function showView(view) {
        $('section').hide();
        switch (view) {
            case 'home':
                $('#viewWelcome').show();
                break;
            case 'catalog':
                $('#viewCatalog').show();
                $('#menu').show();
                loadPosts();
                break;
            case 'submit':
                $('#viewSubmit').show();
                break;
            case 'posts':
                $('#viewMyPosts').show();
                listMyPosts();
                break;
            case 'edit':
                $('#viewEdit').show();
                break;
            case 'comment':
                $('#viewEditComment').show();
                break;
            case 'editAd':
                $('#viewEditAd').show();
                break;

        }
    }

    // ATTACHING EVENT LISTENERS
    $('#logoutLink').click(logout);
    $('#btnRegister').click(register);
    $('#btnLogin').click(login);
    $('#btnSubmitPost').click(createPost);
    // $('#catalogNav').click(showView('catalog'));
    // $('#submitNav').click(showView('submit'));
    $('#myPostsNav').click(() => showView('posts'));
    $('#catalogNav').click(() => showView('catalog'));
    $('#submitNav').click(() => showView('submit'));
    $('#delPost').click(deletePost());



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
    }

    function handleError(reason) {
        showError(reason.responseJSON.description);
    }

    // REQUESTER
    let requester = (() => {

        function makeAuth(type) {
            if (type === 'basic') {
                return 'Basic ' + btoa(appKey + ':' + appSecret);
            }
            else {
                return 'Kinvey ' + sessionStorage.getItem('authtoken');
            }
        }

        function makeRequest(method, module, url, auth) {
            return req = {
                url: baseUrl + module + '/' + appKey + '/' + url,
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

    // USER GREETING AND SHOWVIEW ON LOGIN AND LOGOUT
    function userLoggedIn() {
        $('#viewCatalog').show();
        $('#profile span').text(`Welcome, ${sessionStorage.getItem('username')}!`);
        $('#profile').show();
    }

    function userLoggedOut() {
        $('#menu').hide();
        $('#profile').hide();
        $('#viewWelcome').show();
    }

    // SAVE SESSION
    function saveSession(data) {
        sessionStorage.setItem('username', data.username);
        sessionStorage.setItem('id', data._id);
        sessionStorage.setItem('authtoken', data._kmd.authtoken);
        userLoggedIn();
    }

    // LOGIN
    async function login(ev) {
        ev.preventDefault();
        let form = $('#loginForm');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="password"]').val();

        try {
            let data = await requester.post('user', 'login', {username, password}, 'basic');
            showInfo('Login successful.');
            saveSession(data);
            showView('catalog');
            form.find('input[name="username"]').val('');
            form.find('input[name="password"]').val('');
        } catch (err) {
            handleError(err);
        }
    }

    // REGISTER
    async function register(ev) {
        ev.preventDefault();
        let form = $('#registerForm');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="password"]').val();
        let repeatPass = form.find('input[name="repeatPass"]').val();

        try {
            if (username.length < 3) {
                handleError("Username is too short");
                return;
            }

            if (password.length < 6) {
                handleError("Password is too short");
                return;
            }

            if (password !== repeatPass) {
                return handleError("Passwords don't match.");
            }
            else {
                let data = await requester.post('user', '', {username, password}, 'basic');
                showInfo('User registration successful.');
                saveSession(data);
                showView('catalog');
                form.find('input[name="username"]').val('');
                form.find('input[name="password"]').val('');
                form.find('input[name="repeatPass"]').val('');
            }
        } catch (err) {
            handleError(err);
        }
    }

    // LOGOUT
    async function logout() {
        try {
            let data = await requester.post('user', '_logout', {authtoken: sessionStorage.getItem('authtoken')});
            sessionStorage.clear();
            showInfo('Logout successful.');
            userLoggedOut();
            showView('home');
        } catch (err) {
            handleError(err);
        }
    }

    // LIST POSTS
    async function loadPosts() {
        $('#viewCatalog div.posts').empty();
        let postsToList = $('.posts');
        let html = ``;
        postsToList.append(html);
        let data = await requester.get('appdata', 'posts');
        $('#viewCatalog div.posts').empty();
        // console.log(data.length);
        if (data.length === 0) {
            return postsToList.append('<p>No posts in database</p>');
        }

        for (let i = 0; i < data.length; i++) {
            html += `<article class="post"><div class="col rank">
                        <span>${i + 1}</span>
                    </div>`;
            html += `<div class="col thumbnail">
                        <a href="${data[i].url}">
                            <img src="${data[i].imageUrl}"></a></div>`;
            html += `<div class="post-content">
                        <div class="title">
                            <a href="${data[i].url}">
                                ${data[i].title}
                            </a>
                        </div>`;
            html += ` <div class="details">
                            <div class="info">
                                submitted ${calcTime(data[i]._kmd.lmt)} ${data[i].author}
                            </div>
                            <div class="controls">
                                <ul>`;

            if (data[i].author === sessionStorage.getItem('username')) {
                let del = $('#delPost');
                del.click(deletePost(data[i].id));
                html += `<li class="action"><a class="editLink" href="#">edit</a></li>
                                    <li class="action"><a class="deleteLink" href="#" id="delPost">delete</a></li> </ul>
                            </div>
                            </div></article>\`;`;
            }
            else {
                html += `<li class="action"><a class="commentsLink" href="#">comments</a></li> </ul>
                            </div>
                            </div></article>`;
            }
        }
        postsToList.append(html);

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

    async function listMyPosts() {
        $('#viewMyPosts div.posts').empty();
        let postsToList = $('.posts');
        let html = ``;
        postsToList.append(html);
        let data = await requester.get('appdata', 'posts');
        $('#viewMyPosts div.posts').empty();
        // console.log(data.length);
        if (data.length === 0) {
            return postsToList.append('<p>No posts in database</p>');
        }
        let count = 1;
        for (let i = 0; i < data.length; i++) {

            if (data[i].author === sessionStorage.getItem('username')) {
                let del = $('#delPost');
                del.click(deletePost(data[i].id));

                html += `<article class="post"><div class="col rank"><span>${count}</span>
                    </div>`;

                html += `<div class="col thumbnail">
                        <a href="${data[i].url}">
                            <img src="${data[i].imageUrl}"></a></div>`;
                html += `<div class="post-content">
                        <div class="title">
                            <a href="${data[i].url}">
                                ${data[i].title}
                            </a>
                        </div>`;
                html += `<div class="details">
                            <div class="info">
                                submitted ${calcTime(data[i]._kmd.lmt)} ${data[i].author}
                            </div>
                            <div class="controls">
                                <ul>`;
                html += `<li class="action"><a class="commentsLink" href="#">comments</a></li><li class="action"><a class="editLink" href="#">edit</a></li>
                                    <li class="action"><a class="deleteLink" href="#" id="delPost" \>delete</a></li> </ul>
                            </div>
                            </div></article>`;
                count++;
            }

            postsToList.append(html);

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
    }

    async function deletePost(id) {
        await requester.remove('appdata', 'posts/' + id);
        showInfo('Ad deleted');
        showView('ads');

    }
}