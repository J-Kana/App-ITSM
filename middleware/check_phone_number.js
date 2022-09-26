checkNumber = (phone) => {
    let result = { status: null, data: null }
    if(phone.substring(0,1) == "8" && phone.length == 11) {
        phone = phone.replace(phone[0], "7")
        result = {status: 200, data: phone}
        return result;
    }
    else if(phone.substring(0,1) == "7" && phone.length == 11) {
        phone = phone.replace(phone[0], "7")
        result = {status: 200, data: phone}
        return result;
    }
    else if(phone.substring(0,2) == "+7" && phone.length == 12) {
        phone = phone.replace(phone[0], "")
        result = {status: 200, data: phone}
        return result;
    }
    else {
        result = {status: 400, data: phone}
        return result;
    }
}

module.exports = checkNumber;