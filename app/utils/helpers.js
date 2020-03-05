function prettyDate(millis) {
    return new Date(millis).toLocaleString();
}

module.exports = {
    prettyDate: prettyDate
}
