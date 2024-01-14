/**
 * @name AutoMessage
 * @author Elaina Da Catto
 * @description Auto sent messages after join lobby
 * @link https://github.com/Elaina69
 * @Nyan Meow~~~
 */

import text from "./config.json"

let phase, pvp_net_id, summoner_id, set_timeout_player_joined, pvp_net_room_id, message_sent_phase
let regex1 = /\/lol-chat\/v1\/conversations\/.+\/messages\/.+/
let regex2 = /(?:\/lol-chat\/v1\/conversations\/)(.+)(?:\/messages\/.+)/
let message_sent = false

async function subscribe_endpoint(endpoint, callback) {
	const uri = document.querySelector('link[rel="riot:plugins:websocket"]').href
	const ws = new WebSocket(uri, 'wamp')

	ws.onopen = () => ws.send(JSON.stringify([5, 'OnJsonApiEvent' + endpoint.replace(/\//g, '_')]))
	ws.onmessage = callback
}

async function send_message_in_lobby(message) {
	await fetch(`/lol-chat/v1/conversations/${pvp_net_room_id}/messages`, {
		"headers": {
			"accept": "application/json",
			"content-type": "application/json",
		},
		"body": `{\"type\":\"chat\",\"fromId\":\"${pvp_net_id}\",\"fromSummonerId\":${summoner_id},\"isHistorical\":false,\"timestamp\":\"${new Date().toISOString()}\",\"body\":\"${message}\"}`,
		"method": "POST",
	});
}

let updateUserPvpNetInfos = async message => {
	let data = JSON.parse(message["data"])[2]["data"];
	if (data != undefined) {
		pvp_net_id = data["id"];
		summoner_id = data["summonerId"]
	}
}

let updatePhaseCallback = async message => { 
	phase = JSON.parse(message["data"])[2]["data"]
}

let sendMessageUponArrivingLobby = async message => {
	const data = JSON.parse(message.data)
	const phasesTracked = ["ChampSelect"]

	if (text["Console-debug"])
		console.log(phase, pvp_net_id, summoner_id, pvp_net_room_id)

	if (!message_sent && regex1.exec(data[2]["uri"]) && data[2]["data"] && "body" in data[2]["data"] && data[2]["data"]["body"] == "joined_room" && phasesTracked.includes(phase)) {
		message_sent = true
		message_sent_phase = phase
		pvp_net_room_id = regex2.exec(data[2]["uri"])[1]
		clearTimeout(set_timeout_player_joined)
		set_timeout_player_joined = setTimeout(async () => {
			for (let message_cron of text["Text Messages"]){
				let message = message_cron
				if (message && message.length > 0){
					await send_message_in_lobby(message)
				}
			}
		}, 1500)
	}
}

let resetMessageSentStatus = async message => {
	if (JSON.parse(message["data"])[2]["data"] != message_sent_phase) 
		message_sent = false
}

window.addEventListener('load', () => {
	subscribe_endpoint("/lol-chat/v1/me", updateUserPvpNetInfos)
	subscribe_endpoint("/lol-gameflow/v1/gameflow-phase", updatePhaseCallback)
	subscribe_endpoint("/lol-chat/v1/conversations", sendMessageUponArrivingLobby)
	subscribe_endpoint('/lol-gameflow/v1/gameflow-phase', resetMessageSentStatus)
})