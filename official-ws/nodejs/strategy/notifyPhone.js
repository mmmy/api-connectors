var exec = require('child_process').exec
const moment = require('moment-timezone')

const now = function () {
    return moment().tz('Asia/ShangHai').format('MM-DD hh:mm:ss')
}

function notifyPhone(msg, sound) {
    notifyPhoneUser(msg, "aiee6nmcgz678kbouuoujsmf4wko96", "gdz6nj653847v5e65px71bcstdsicv", sound)
}

function notifyPhoneUser(msg, token, user, sound) {

    const isProd = process.env.NODE_ENV === 'production'
    // msg = `${now()}  ${msg}`
    if (!isProd) {
        msg = '[TEST] ' + msg
    }
    sound = sound || 'pushover'
    exec(`curl -s \
        --form-string "html=1" \
        --form-string "token=${token}" \
        --form-string "user=${user}" \
        --form-string "sound=${sound}" \
        --form-string "message=${msg}" \
        https://api.pushover.net/1/messages.json`)
}

exports.notifyPhoneUser = notifyPhoneUser
exports.notifyPhone = notifyPhone

exports.now = now
