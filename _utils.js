const version = "1.2.1"
let riotclient_auth, riotclient_port;
let regex_rc_auth = /^--riotclient-auth-token=(.+)$/
let regex_rc_port = /^--riotclient-app-port=([0-9]+)$/

 // to display debug messages
let routines = [] // array of functions that will be called routinely
let mutationCallbacks = [] // array of functions that will be called in mutation observer
 // automatically updated to your pvp.net id

let summoner_region; // player current region

/** used to add css files to document body */
function addCss(filename) {
	const style = document.createElement('link')
	style.href = filename
	style.type = 'text/css'
	style.rel = 'stylesheet'
	document.body.append(style)
}

/** fetch the Riot client API port/auth and save it to variables that can be exported */
async function fetch_riotclient_credentials() {
	await fetch("/riotclient/command-line-args", {
		"method": "GET",
	}).then(response => response.json()).then(data => {
		data.forEach(elem => {
			if (regex_rc_auth.exec(elem))
				utils.riotclient_auth = regex_rc_auth.exec(elem)[1];
			else if (regex_rc_port.exec(elem))
				utils.riotclient_port = regex_rc_port.exec(elem)[1];
		});
	})
	if (debug_sub)
		console.log(utils.riotclient_auth, utils.riotclient_port)
}

/** Callback function to be sent in subscribe_endpoint() to update the variable holding user pvp.net infos */


/** Callback function to be sent in subscribe_endpoint() to log uri & data object */
let debugLogEndpoints = async message => { if (debug_sub) console.log(JSON.parse(message["data"])[2]["uri"], JSON.parse(message["data"])[2]["data"]) }

/**
 * Add function to be called in the MutationObserver API
 * @param {function} callback The callback function
 * @param {[string]} target The list of class targets
 */
function routineAddCallback(callback, target) {
	routines.push({ "callback": callback, "targets": target })
}

function mutationObserverAddCallback(callback, target) {
	mutationCallbacks.push({ "callback": callback, "targets": target })
}

let utils = {
	riotclient_auth: riotclient_auth,
	riotclient_port: riotclient_port,

	subscribe_endpoint: subscribe_endpoint,
	routineAddCallback: routineAddCallback,
	mutationObserverAddCallback: mutationObserverAddCallback,
	addCss: addCss
}

export default utils

window.addEventListener('load', () => {
	fetch_riotclient_credentials()
	
	
	//subscribe_endpoint("", debugLogEndpoints)
	window.setInterval(() => {
		routines.forEach(routine => {
			routine.callback()
		})
	}, 1300)

	const observer = new MutationObserver((mutationsList) => {
		for (let mutation of mutationsList) {
			for (let addedNode of mutation.addedNodes) {
				if (addedNode.nodeType === Node.ELEMENT_NODE && addedNode.classList) {
					for (let addedNodeClass of addedNode.classList) {
						for (let obj of mutationCallbacks) {
							if (obj.targets.indexOf(addedNodeClass) != -1 || obj.targets.indexOf("*") != -1) {
								obj.callback(addedNode)
							}
						}
					}
				}
			}
		}
	});
	observer.observe(document, { attributes: false, childList: true, subtree: true });
})
