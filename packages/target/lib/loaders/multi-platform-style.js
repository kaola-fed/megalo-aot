module.exports.pitch = function (request) {
    const platformReg = /platform=(\w+)/;

    if (platformReg.test(request)) { // the css request contains platform info
        let platform = 'mp' + request.match(platformReg)[1],
            current = this.platform;
        
        if (platform != current) {
            return '';
        }
    }
}

module.exports = function (source) {
    return source;
}