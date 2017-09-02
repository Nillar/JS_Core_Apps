let auth = (() => {
    function login() {
        let form = $('#formLogin');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();
        console.log(username);
        console.log(password);

        let userData = {
            username,
            password
        };

        return requester.post('user', 'login', 'basic', userData)

        // try {
        //     let data = await requester.post('user', 'login', {username, password}, 'basic');
        //     showInfo('Logged in');
        //     saveSession(data);
        //     showView('ads');
        // } catch (err) {
        //     handleError(err);
        // }
    }

    function register() {
        let form = $('#formRegister');
        let username = form.find('input[name="username"]').val();
        let password = form.find('input[name="passwd"]').val();

        let userData = {
            username,
            password
        };

        return requester.post('user', 'login', 'basic', userData)

        // try {
        //     let data = await requester.post('user', '', {username, password}, 'basic');
        //     showInfo('Registered');
        //     saveSession(data);
        //     showView('ads');
        // } catch (err) {
        //     handleError(err);
        // }
    }

    function logout() {
        let logoutData = {
            authtoken: sessionStorage.getItem('authtoken')
        };

        return requester.post('user', '_logout', 'kinvey', logoutData);
        // try {
        //     let data = requester.post('user', '_logout', {authtoken: localStorage.getItem('authtoken')});
        //     localStorage.clear();
        //     showInfo('Logged out');
        //     userLoggedOut();
        //     showView('home');
        // } catch (err) {
        //     handleError(err);
        // }
    }

    return {
        login,
        register,
        logout
    }
})()