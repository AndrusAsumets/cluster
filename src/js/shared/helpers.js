export function convertRange(value, r1, r2) { 
    return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0]
}

export function size() {
	var w = window,
	    d = document,
	    e = d.documentElement,
	    g = d.getElementsByTagName('body')[0],
	    x = w.innerWidth || e.clientWidth || g.clientWidth,
	    y = w.innerHeight|| e.clientHeight|| g.clientHeight
	return { x: x, y: y }
}

export function isCached(objects, object) {
	for (var i = 0; i < objects.length; i++) {
		var count = Object.keys(object).length
		var found = 0
		for (var j = 0; j < count; j++) {
			var key = Object.keys(object)[j]
			if (objects[i][key] == object[key]) found++
		}

		if (found == count) return i
	}
}

export function decodeQuery() {
    var query = location.search.substr(1)
    var result = {}
    query.split('&').forEach((part) => {
        var item = part.split('=')
        result[item[0]] = decodeURIComponent(item[1])
    })
    return result
}

export function encodeQuery(query) {
    let parameters = ''
    let index = 0
    for (var key in query) {
        if (key && query[key]) {
            if (index == 0) parameters += '?'
            else parameters += '&'
            parameters += key + "=" + query[key]
            index++
        }
    }
    return parameters
}