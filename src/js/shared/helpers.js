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

export function getUrlParams(parameter) {
	var url = new URL(window.location.href)
	return url.searchParams.get(parameter)	
}