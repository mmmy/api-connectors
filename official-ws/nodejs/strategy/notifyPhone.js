var exec = require('child_process').exec
const moment = require('moment-timezone')

const now = function () {
    return moment().tz('Asia/ShangHai').format('MM-DD hh:mm:ss')
}

exports.notifyPhone = function (msg, sound) {
    const isProd = process.env.NODE_ENV === 'production'
    // msg = `${now()}  ${msg}`
    if (!isProd) {
        msg = 'test ' + msg
    }
    sound = sound || 'pushover'
    exec(`curl -s \
        --form-string "html=1" \
        --form-string "token=aiee6nmcgz678kbouuoujsmf4wko96" \
        --form-string "user=gdz6nj653847v5e65px71bcstdsicv" \
        --form-string "sound=${sound}" \
        --form-string "message=${msg}" \
        https://api.pushover.net/1/messages.json`)
}

exports.now = now
