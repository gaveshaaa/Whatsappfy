const qrcode = require('qrcode-terminal');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const https = require('https');
const axios = require('axios');

var lastFM_username = "USER_NAME";
var defaultStatus = "Hey there! I am using WhatsApp";
var interval = 5000;
var enableLogging = true;
var errorLogging = false;

console.log("================================================");
console.log("Current Settings");
console.log(`LastFM Username > ${lastFM_username}`);
console.log("Current Delay is > " + (interval / 1000) + " seconds");
console.log(`Default/Fallback About me > ${defaultStatus}`);
console.log(" ")
console.log(`Node Version ${process.version.node}`);
console.log("================================================");

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, {
        small: true
    });
});

client.on('auth_failure', () => {
    logData("WhatsappFy was unable to Authenticate. Please delete the .wwebjs_auth file and Try again!")
});

client.on('change_state', state => {
    logData(`STATE :- ${state}`);
});

client.on('ready', async () => {
    logData(`Successfully Connected! - ${client.info.wid.user}`);
    logData(`Please use Ctrl + C to Quit the application [!]`);
    const lastfmURL = `http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastFM_username}&api_key=APIKEY!!!!!!!!!!&format=json`;
    var lastSong;
    var isListening;

    setInterval(async function () {
        await axios.get(lastfmURL)
            .then(function (response) {
                const recent = response.data.recenttracks.track[0];
                let songName = recent.name;
                let songAuthor = recent.artist["#text"];
                if (recent["@attr"] != null && songName != lastSong) {
                    lastSong = songName;
                    client.setStatus(`👋 Listening to ${songName} by ${songAuthor} ✖️ WhatsappFY`);
                    isListening = true;
                } else if (recent["@attr"] == undefined) {
                    client.setStatus(defaultStatus);
                }
            })
            .catch(function (error) {
                if (!errorLogging) { return; }
                logError("Data not found. Please wait [!]");
            });
    }, interval)

    setInterval(() => {
        remind("Please USE Ctrl + C to Quit the application")
        remind(process.memoryUsage());
    }, 10000)

});

client.on('disconnect', async message => {
    await client.setStatus(defaultStatus);
    client.destroy();
});

client.initialize();

process.on('SIGINT', async () => {
    logData("Whatsappfy succesfully stopped")
    logData("You can now close out your CMD/Terminal Window.")
    await client.setStatus(defaultStatus);
    client.destroy();
    process.exit(0);
});

function logData(message) {
    if (enableLogging) {
        console.log(`WhatsappFY > ${message}`);
    }
}

function logError(message) {
    if (enableLogging) {
        console.log("\x1b[41m", `Error > ${message}`);
    }
}

function remind(message) {
    if (enableLogging) {
        console.log("\x1b[33m%s\x1b[0m", `[Reminder | ${message}]`);
    }
}




