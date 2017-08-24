export function convertRange(value, r1, r2) { 
    return (value - r1[0]) * (r2[1] - r2[0]) / (r1[1] - r1[0]) + r2[0]
}

export function createCookie(name, value, days) {
    var expires = ""
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000))
        expires = "; expires=" + date.toUTCString()
    }
    document.cookie = name + "=" + value + expires + "; path=/"
}

export function readCookie(name) {
    var nameEQ = name + "="
    var ca = document.cookie.split(';')
    for(var i=0;i < ca.length;i++) {
        var c = ca[i]
        while (c.charAt(0)==' ') c = c.substring(1,c.length)
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length)
    }
    return null;
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

export function getUrlParams(parameter) {
	var url = new URL(window.location.href)
	return url.searchParams.get(parameter)	
}

export function alreadyLinked(player, from, to) {
	var links = player.links
	
	for (var i = 0; i < links.length; i++) {
		if (
			links[i].from[0] == from[0] &&
			links[i].from[1] == from[1] &&
			links[i].to[0] == to[0] &&
			links[i].to[1] == to[1]
		) return true
	}
	
	return false
}