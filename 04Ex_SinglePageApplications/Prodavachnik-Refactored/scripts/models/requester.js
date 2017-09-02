let requester = (() => {

    const baseUrl = 'https://baas.kinvey.com/';
    const appKey = 'kid_ByZJeptvW';
    const appSecret = 'ca01b75d20574cfbbadc07f23caf1080';

    function makeAuth(type) {
        if (type === 'basic') {
            return 'Basic ' + btoa(appKey + ':' + appSecret);
        }
        else {
            return 'Kinvey ' + localStorage.getItem('authtoken');
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

    function post(module, url, auth, data) {
        let req = makeRequest('POST', module, url, auth);
        req.data = data;
        console.log(req.data);
        // req.headers['Content-Type'] = 'application/json';
        return $.ajax(req);
    }

    function update(module, url, auth, data) {
        let req = makeRequest('PUT', module, url, auth);
        req.data = data;
        // req.headers['Content-Type'] = 'application/json';
        return $.ajax(req);
    }

    function remove(module, url, auth) {
        return $.ajax(makeRequest('DELETE', module, url, auth));
    }

    return {
        get, post, update, remove
    }
})()