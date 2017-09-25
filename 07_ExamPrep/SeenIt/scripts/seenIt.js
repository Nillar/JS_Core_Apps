function startApp() {

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_rkHqs6zK-"; // APP KEY HERE
    const kinveyAppSecret = "0362fddf253c498f98f8aada81055d48"; // APP SECRET HERE

    // console.log('hi');
    $('section').hide();

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

    // SHOW VIEW
    function showView(view, id) {
        $('section').hide();
        switch (view) {
            case 'catalog':
                $('#viewCatalog').show();
                listPosts();
                break;
            case 'createPost':
                $('#viewSubmit').show();
                break;
            case 'details':
                $('#viewComments').show();
                break;
            case 'myPosts':
                $('#viewMyPosts').show();
                listMyPosts();
                break;
            case 'comment':
                $('#viewComments').empty();
                detailPost(id);
                break;
            case 'editPost':
                $('#viewEdit').show();
        }
    }

    // NOTIFICATIONS
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
    $('#myPosts').click(() => (showView('myPosts')));
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
            // console.log('posts');
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


    }

    //LISTING MY POSTS
    async function listMyPosts() {
        $('section').hide();
        $('#viewMyPosts').show();
        $('#viewMyPosts div.posts').empty();
        let data = await requester.get('appdata', 'posts');
        let postCount = 0;
        if (data.length === 0) {
            return $('.posts').append('<p>No posts in database</p>');
        }
        let count = 1;

        for (let post of data) {
            if (post._acl.creator === sessionStorage.getItem('userId')) {
                postCount++;
                let article = $('<article class="post">');
                let colRank = $('<div class="col rank">');
                let colThumbnail = $('<div class="col thumbnail">');
                let postContent = $('<div class="post-content">');

                let comments = $(`<a class="commentsLink" href="#">comments</a>`).click(() => detailPost(post._id));
                let edit = $(`<a class="editLink" href="#" data-target="Edit">edit</a>`).click(() => editPost(post._id));
                let deleteP = $(`<a class="deleteLink" href="#">delete</a>`).click(() => deletePost(post._id));

                let actionLi = $('<li class="action">');
                colRank.append($(`<span>${count}</span>`));
                article.append(colRank);
                colThumbnail.append($(`<a href="${post.url}"><img src="${post.imageUrl}"></a>`));
                article.append(colThumbnail);

                postContent.append($(`<div class="title">`).append(`<a href="${post.url}">${post.title}</a>`));
                postContent.append($(`<div class="details>">`)
                    .append($(`<div class="info">submitted ${calcTime(post._kmd.ect)} ago by ${post.author}</div>`))
                    .append($(`<div class="controls">`)
                        .append($('<ul>')
                            .append($(actionLi)
                            ))));
                actionLi.append(comments);
                actionLi.append(edit);
                actionLi.append(deleteP);

                article.append(postContent);
                $('.posts').append(article);

                count++;
            }

        }
        if(postCount === 0){
            return $('.posts').append('<article class="post"><p>No posts in database</p></article>');
        }

        // https://baas.kinvey.com/appdata/app_id/posts?query={"author":"username"}&sort={"_kmd.ect": -1}
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
    async function editPost(id) {
        $('#viewComments div').empty();
        $('#viewComments article').empty();
        $('#viewComments').empty();
        showView('editPost');
        let data = await requester.get('appdata', 'posts/' + id);

        let form = $('#editPostForm');
        form.find('input[name="url"]').val(`${data.url}`);
        form.find('input[name="title"]').val(`${data.title}`);
        form.find('input[name="image"]').val(`${data.imageUrl}`);
        form.find('textarea[name="description"]').val(`${data.description}`);

        let clicks = 0;
        // console.log(clicks);
        $('#btnEditPost').click(() => edit(data._id));


        async function edit(id) {
            if(clicks === 0) {
                let url = form.find('input[name="url"]').val();
                let title = form.find('input[name="title"]').val();
                let imageUrl = form.find('input[name="image"]').val();
                let description = form.find('textarea[name="description"]').val();
                let author = sessionStorage.getItem('username');

                if (form.find('input[name="title"]').val().length === 0) {
                    showError('Title cannot be empty');
                    return;
                }
                if (url.slice(0, 4) !== 'http') {
                    showError('Link is incorrect');
                    return;
                }

                let editedPost = {
                    url, title, imageUrl, description, author
                };
                clicks++;

                try {
                    $('#viewComments').empty();
                    await requester.update('appdata', 'posts/' + id, editedPost);
                    showInfo('Post edited.');
                    showView('comment', id);
                    form.find('input[name="url"]').val('');
                    form.find('input[name="title"]').val('');
                    form.find('input[name="image"]').val('');
                    form.find('textarea[name="description"]').val('');

                } catch (err) {
                    handleError(err);
                }
            }
        }
    }

    //DELETING POSTS
    async function deletePost(id) {
        try {
            await requester.remove('appdata', 'posts/' + id);
            showInfo('Post deleted');
            showView('catalog');
        } catch (err) {
            handleError(err);
        }
    }

    // DETAIL POST AND DELETE POST
    async function detailPost(id) {


        $('#viewComments').empty();
        let clicks = 0;
        let data = await requester.get('appdata', 'posts/' + id);
        let html = $('#viewComments');

        // THE POST ITSELF
        let postClass = $(`<div class="post">`);
        let colThumbnail = $('<div class="col thumbnail">');
        let image = $(`<a href="${data.url}"><img src="${data.imageUrl}"></a>`);
        let postContent = $('<div class="post-content">');
        let title = $(`<div class="title"><a href="${data.url}">${data.title}</a></div>`);

        if (data.description === '') {
            data.description = "No description.";
        }

        let details = $(`<div class="details"><p>${data.description}</p><div class="info">submitted ${calcTime(data._kmd.ect)} ago by ${data.author}</div></div>`);
        let controls = $('<div class="controls">');
        let edit = $(`<a class="editLink" href="#" data-target="Edit">edit</a>`).click(() => editPost(data._id));
        let remove = $(`<a class="deleteLink" href="#">delete</a>`).click(() => deletePost(data._id));

        if (data.author === sessionStorage.getItem('username')) {
            let ul = $('<ul>');
            let li = $('<li class="action">');

            li.append(edit);
            li.append(remove);
            ul.append(li);
            controls.append(ul);
        }

        colThumbnail.append(image);
        title.append(details);
        details.append(controls);

        postContent.append(title);
        postContent.append(details);

        postClass.append(colThumbnail);
        postClass.append(postContent);
        postClass.append($('<div class="clear"></div>'));

        // THE COMMENT FORM
        let commentFormDiv = $('<div class="post post-content">');

        let form = $('<form id="commentForm"><label>Comment</label><textarea name="content" type="text"></textarea>');
        let commentBtn = $('<input type="button" value="Add Comment" id="btnPostComment">').click(() => createComment(data._id));

        form.append(commentBtn);
        commentFormDiv.append(form);

        html.append(postClass);
        html.append(commentFormDiv);

        // COMMENTS
        let comments = await requester.get('appdata', 'comments');
        let count = 0;
        let commentContainer = '';


        for (let i = 0; i < comments.length; i++) {
            if (data._id === comments[i].postId) {

                count++;
                commentContainer = '';
                commentContainer += `<article class="post post-content">`;
                commentContainer += `<p>${comments[i].content}</p>`;
                commentContainer += `<div class="info">submitted ${calcTime(comments[i]._kmd.ect)} ago by ${comments[i].author}`;

                if (comments[i]._acl.creator === sessionStorage.getItem('userId')) {
                    commentContainer += ` |<a class="deleteLink" id="btnDeleteComment" href="#">delete</a>`;
                }
                commentContainer += `</div></article>`;
                html.append(`${commentContainer}`);
                $('a#btnDeleteComment.deleteLink').click(() => deleteComment(comments[i]._id, data._id));
            }
        }


        if (count === 0) {
            commentContainer += `<article class="post post-content">`;
            commentContainer += `<p>No comments yet.</p></article>`;
            html.append(`${commentContainer}`);
        }


        showView('details');
        return;

        async function deleteComment(id, postId) {
            // let data = await requester.get('appdata', 'posts/', postId);
            if(clicks === 0) {
                clicks++;
                try {
                    await requester.remove('appdata', 'comments/' + id);
                    showInfo('Comment deleted');

                    showView('comment', postId);

                } catch (err) {
                    handleError(err);
                }
            }
        }

    }

    // CREATE COMMENT
    async function createComment(id) {

        let form = $('#commentForm');
        let content = form.find('textarea[name="content"]').val();
        let postId = id;
        // let time = calcTime(Date.now());
        let author = sessionStorage.getItem('username');

        let comment = {
            author, content, postId
        };
        try {
            if(content === ''){
                showError('Comments cannot be empty.');
                return;
            }
            await requester.post('appdata', 'comments', comment);
            showInfo('Comment created.');
            showView('comment', id);
            form.find('textarea[name="content"]').val('');

        } catch (err) {
            handleError(err);
        }
    }
}