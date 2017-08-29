function startApp() {

    const baseUrl = 'https://baas.kinvey.com/';
    const appKey = 'kid_ByZJeptvW';
    const appSecret = 'ca01b75d20574cfbbadc07f23caf1080';

    $('header').find('a').show();
    const adsDiv = $('#ads');
    const advertInfo = $('<div>');

    function showView(view) {
        $('section').hide();
        switch (view) {
            case 'home':
                $('#viewHome').show();
                break;
            case 'login':
                $('#viewLogin').show();
                break;
            case 'register':
                $('#viewRegister').show();
                break;
            case 'ads':
                $('#viewAds').show();
                loadAds();
                break;
            case 'create':
                $('#viewCreateAd').show();
                break;
            case 'details':
                $('#viewDetailsAd').show();
                break;
            case 'edit':
                $('#viewEditAd').show();
                break;
            case 'comment':
                $('#viewEditComment').show();
                break;
        }
    }

    // function navigateTo(e) {
    //     $('section').hide();
    //     let target = $(e.target).attr('data-target');
    //     $('#' + target).show();
    // }

    // Attach event listeners
    $('#linkHome').click(() => showView('home'));
    $('#linkLogin').click(() => showView('login'));
    $('#linkRegister').click(() => showView('register'));
    $('#linkListAds').click(() => showView('ads'));
    $('#linkCreateAd').click(() => showView('create'));
    $('#linkLogout').click(logout);

    $('#buttonLoginUser').click(login);
    $('#buttonRegisterUser').click(register);
    $('#buttonCreateAd').click(createAd);
    $('#buttonEditAd').click(editAd);
    $('#buttonEditComment').click(editComment);
    $('#commentBtn').click(createComment);

    // Notifications
    $(document).on({
        ajaxStart: () => $('#loadingBox').show(),
        ajaxStop: () => $('#loadingBox').fadeOut()
    });

    $('#infoBox').click((event) => $(event.target).hide());
    $('#errorBox').click((event) => $(event.target).hide());

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(() => $('#infoBox').fadeOut(), 3000);
    }

    function showError(message) {
        $('#errorBox').text(message);
        $('#errorBox').show();
    }

    function handleError(reason) {
        showError(reason.responseJSON.description);
    }

    let requester = (() => {

        function makeAuth(type) {
            if (type === 'basic') return 'Basic ' + btoa(appKey + ':' + appSecret);
            else return 'Kinvey ' + localStorage.getItem('authtoken');
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

    if (localStorage.getItem('authtoken') !== null &&
        localStorage.getItem('username') !== null) {
        userLoggedIn();
    } else {
        userLoggedOut();
    }
    showView('home');

    function userLoggedIn() {
        $('#loggedInUser').text(`Welcome, ${localStorage.getItem('username')}!`);
        $('#loggedInUser').show();
        $('#linkLogin').hide();
        $('#linkRegister').hide();
        $('#linkLogout').show();
        $('#linkListAds').show();
        $('#linkCreateAd').show();
    }

    function userLoggedOut() {
        $('#loggedInUser').text('');
        $('#loggedInUser').hide();
        $('#linkLogin').show();
        $('#linkRegister').show();
        $('#linkLogout').hide();
        $('#linkListAds').hide();
        $('#linkCreateAd').hide();
    }

    function saveSession(data) {
        localStorage.setItem('username', data.username);
        localStorage.setItem('id', data._id);
        localStorage.setItem('authtoken', data._kmd.authtoken);
        userLoggedIn();
    }

    async function login() {
        let form = $('#formLogin');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();

        try {
            let data = await requester.post('user', 'login', {username, password}, 'basic');
            showInfo('Logged in');
            saveSession(data);
            showView('ads');
            form.find('input[name="username"]').val('');
            form.find('input[name="passwd"]').val('');
        } catch (err) {
            handleError(err);
        }
    }

    async function register() {
        let form = $('#formRegister');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();

        try {
            let data = await requester.post('user', '', {username, password}, 'basic');
            showInfo('Registered');
            saveSession(data);
            showView('ads');
            form.find('input[name="username"]').val('');
            form.find('input[name="passwd"]').val('');
        } catch (err) {
            handleError(err);
        }
    }

    async function logout() {
        try {
            let data = await requester.post('user', '_logout', {authtoken: localStorage.getItem('authtoken')});
            localStorage.clear();
            showInfo('Logged out');
            userLoggedOut();
            showView('home');
        } catch (err) {
            handleError(err);
        }
    }

    async function loadAds() {
        let data = await requester.get('appdata', 'posts');
        // console.log(data);
        adsDiv.empty();
        if (data.length === 0) {
            adsDiv.append('<p>No ads in database</p>');
            return;
        }

        for (let ad of data) {
            let html = $('<div>');
            html.addClass('ad-box');
            let title = $(`<div class="ad-title">${ad.title}</div>`);
            let readMoreBtn = $('<button>Read More</button>').click(() => displayAdvert(ad._id));

            if (ad._acl.creator === localStorage.getItem('id')) {
                let deleteBtn = $('<button>&#10006;</button>').click(() => deleteAd(ad._id));
                deleteBtn.addClass('ad-control');
                deleteBtn.appendTo(title);
                let editBtn = $('<button>&#9998;</button>').click(() => openEditAd(ad));
                editBtn.addClass('ad-control');
                editBtn.appendTo(title);
            }

            html.append(title);
            html.append(`<div><img src="${ad.imageUrl}"></div>`);
            html.append(`<div>Price: ${Number(ad.price).toFixed(2)} | By ${ad.publisher} </div>`);
            adsDiv.prepend(html);
            html.append(readMoreBtn);
        }
    }

    function displayAdvert(advertId) {
        $('#viewDetailsAd div').empty();
        const kinveyAdvertUrl = "https://baas.kinvey.com/" + "appdata/" +
            "kid_ByZJeptvW" + "/posts/" + advertId;
        const kinveyAuthHeaders = {
            'Authorization': "Kinvey " + localStorage.getItem('authtoken'),
        };

        $.ajax({
            method: "GET",
            url: kinveyAdvertUrl,
            headers: kinveyAuthHeaders,
            success: displayAdvertSuccess,
            error: handleError
        });

        function displayAdvertSuccess(advert) {
            advertInfo.append(
                $('<img>').attr("src", advert.imageUrl),
                $('<br>'),
                $('<label>').text('Title:'),
                $('<h1>').text(advert.title),
                $('<label>').text('Description:'),
                $('<p>').text(advert.description),
                $('<label>').text('Publisher:'),
                $('<div>').text(advert.publisher),
                $('<label>').text('Date:'),
                // $('<div>').text(advert.datePublished));
                $('<div>').text(formatDate(advert._kmd.lmt)),
                $('<textarea id="commentArea">'),
                $('<button id="commentBtn">Comment</button>').click(() => createComment(advert._id))
            );


            $('#viewDetailsAd').append(advertInfo);
            showView('details');
            loadComments(advert._id);
        }

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

    }

    async function deleteAd(id) {
        await requester.remove('appdata', 'posts/' + id);
        showInfo('Ad deleted');
        showView('ads');
    }

    function openEditAd(ad) {
        let form = $('#formEditAd');
        form.find('input[name="title"]').val(ad.title);
        form.find('textarea[name="description"]').val(ad.description);
        form.find('input[name="price"]').val(Number(ad.price));
        form.find('input[name="image"]').val(ad.imageUrl);

        form.find('input[name="id"]').val(ad._id);
        form.find('input[name="publisher"]').val(localStorage.getItem('username'));
        form.find('input[name="date"]').val(ad.date);

        showView('edit');
    }

    async function editAd() {
        let form = $('#formEditAd');
        let title = form.find('input[name="title"]').val();
        let description = form.find('textarea[name="description"]').val();
        let price = form.find('input[name="price"]').val();
        let imageUrl = form.find('input[name="image"]').val();
        let id = form.find('input[name="id"]').val();
        let publisher = localStorage.getItem('username');
        let date = form.find('input[name="date"]').val();

        if (title.length === 0) {
            showError('Title cannot be empty');
            return;
        }
        if (Number.isNaN(price)) {
            showError('Price cannot be empty');
            return;
        }

        let editedAd = {
            title, description, price, imageUrl, date, publisher
        };

        try {
            await requester.update('appdata', 'posts/' + id, editedAd);
            showInfo('Ad editted');
            showView('ads');
        } catch (err) {
            handleError(err);
        }
    }

    async function createAd() {
        let form = $('#formCreateAd');
        let title = form.find('input[name="title"]').val();
        let description = form.find('textarea[name="description"]').val();
        let price = Number(form.find('input[name="price"]').val());
        let imageUrl = form.find('input[name="image"]').val();
        let date = (new Date()).toString('yyyy-MM-dd');
        let publisher = localStorage.getItem('username');

        if (title.length === 0) {
            showError('Title cannot be empty');
            return;
        }
        if (Number.isNaN(price)) {
            showError('Price cannot be empty');
            return;
        }

        let newAd = {
            title, description, price, imageUrl, date, publisher
        };

        try {
            await requester.post('appdata', 'posts', newAd);
            showInfo('Ad created');
            showView('ads');
        } catch (err) {
            handleError(err);
        }
    }

    async function loadComments(postId) {

        let data = await requester.get('appdata', 'comments');
        let dataLength = data.length;

        for (let i = 0; i < dataLength; i++) {
            if (data[i].postId === postId) {
                let currentComment = $(`<div id="commentsFeed"><div>${JSON.stringify(data[i].commentText)}<div>${JSON.stringify(data[i].creator)}</div></div>`);
                advertInfo.append(currentComment);
                if (data[i]._acl.creator === localStorage.getItem('id')) {
                    let deleteBtn = $('<button id="deleteComment">Delete</button>').click(() => deleteComment(data[i]._id, postId));
                    currentComment.append(deleteBtn);
                    let editBtn = $('<button id="editComment">Edit</button>').click(() => openEditComment(data[i]._id, data[i]));
                    currentComment.append(editBtn);
                }
            }
        }
    }

    async function createComment(postId) {
        let commentText = $('#commentArea').val();
        let creator = localStorage.getItem('username');
        let comment = {
            commentText: commentText.trim(), creator, postId
        };
        if (commentText.length === 0) {
            showError('Comment cannot be empty.');
            return;
        }
        try {
            await requester.post('appdata', 'comments', comment);
            showInfo('Comment created');
            displayAdvert(postId);

        } catch (err) {
            handleError(err);
        }


        $('#commentArea').val("");

    }

    async function deleteComment(id, postId) {
        try {
            await requester.remove('appdata', 'comments/' + id);
            showInfo('Comment deleted');
            displayAdvert(postId);
            // showView('ads');

        } catch (err) {
            handleError(err);
        }
        // await requester.remove('appdata', 'comments/' + id);
        // showInfo('Comment deleted');
        // // displayAdvert(id);
        // showView('ads');
    }

    function openEditComment(ad, postId) {
        // console.log(ad);
        // console.log(ad._id);
        // console.log('here');
        // console.log(postId._id);
        let form = $('#formEditComment');
        // form.find('input[name="title"]').val(ad.title);
        form.find('textarea[name="text"]').val(ad.commentText);
        // form.find('input[name="price"]').val(Number(ad.price));
        // form.find('input[name="image"]').val(ad.imageUrl);

        form.find('input[name="id"]').val(ad);

        form.find('input[name="postedAt"]').val(postId.postId);
        // console.log(postId._id);
        form.find('input[name="date"]').val(ad.date);


        showView('comment');
    }

    async function editComment() {
        let form = $('#formEditComment');
        let title = form.find('input[name="title"]').val();
        let commentText = form.find('textarea[name="text"]').val();
        let creator = localStorage.getItem('username');
        // let imageUrl = form.find('input[name="postAt"]').val();
        let id = form.find('input[name="id"]').val();
        // console.log(id);
        let postId = form.find('input[name="postedAt"]').val();
        JSON.stringify(postId);
        // console.log(postId);
        // console.log(publisher);
        let date = form.find('input[name="date"]').val();

        if (commentText.length === 0) {
            showError('Comment cannot be empty');
            return;
        }

        let editedComment = {
            commentText, postId, creator
        };

        try {
            await requester.update('appdata', 'comments/' + id, editedComment);
            showInfo('Comment edited');
            displayAdvert(postId);
            // showView('ads');
        } catch (err) {
            handleError(err);
        }
    }

}