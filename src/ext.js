var data = require("./data.js");
const tank_ = require("./tank.js");
var {Parser} = require("./parser.js");
const {Encoder} = require("./encoder.js");
const { Bot } = require("./bot.js")
const { inject } = require("./injection.js")


// Select a tank.
while (1) {
    var tank = window.prompt(`Which tank to use? Select one from: ${Object.keys(tank_.tankTypes)}`) || 'predator'
    if (tank_.tankTypes.hasOwnProperty(tank)) {
        break
    } else {
        window.alert("No such tank: " +  tank + " (not supported).")
    }
}

let bot = new Bot(true, tank_.tankTypes[tank])
// True from the start: if the script loads while the player is already in-game no SPAWN packet
// will fire, so waiting for one would keep initDone false forever.  bot.getOutPackets() manages
// its own spawn/reset lifecycle via bot.spawned, so this guard is not needed.
let initDone = true

// Bot starts OFF — normal gameplay by default. Press ` to toggle bot takeover.
let botActive = false

// -----------------
// Status overlay

var overlay = (function() {
    var div = document.createElement('div')
    div.style.cssText = 'position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;padding:6px 14px;border-radius:6px;font:bold 13px monospace;z-index:9999;pointer-events:none;line-height:1.8'
    document.body.appendChild(div)
    return div
})()

function updateOverlay() {
    overlay.innerHTML = 'DIEP BOT [<code>`</code>]: <span style="color:' + (botActive ? '#4f4' : '#f44') + '">' + (botActive ? 'ON — bot in control' : 'OFF — normal play') + '</span>'
}
updateOverlay()

document.addEventListener('keydown', function(e) {
    if (e.key === '`') {
        botActive = !botActive
        if (botActive) {
            // Reset so the bot re-initialises its build on next spawn cycle.
            bot.spawned = false
        }
        updateOverlay()
        console.log('[DiepBot] Bot ' + (botActive ? 'ACTIVATED — AI in control' : 'DEACTIVATED — manual play'))
    }
})

// -----------------
// WS hooks

function handleRecvData(buffer) {
    try {
        let p = new Parser(buffer)
        // Always parse world state so the bot is ready the moment it is switched on.
        bot.worldUpdate(p.parseInbound())
    } catch (e) {
        // About 5% of packets the parser currently fails to parse.
        // Not the issue though, this happens rare enough and does not affect the performance much.
        // We are able to correct for missed data.
    }
    return buffer
}

function sendPackets(wsInstance, packets) {
    for (let packet of packets) {
        let enc = new Encoder()
        proxiedSend.call(wsInstance, enc.encodeOutbound(packet))
    }
    return null
}

function handleSendData(buffer) {
    // Read the packet kind from the raw first byte.
    // All diep.io outbound packet kinds are < 128 so they encode as a single
    // byte in both i8 and varint form — no full parse needed here, which also
    // avoids assertEOF() throws when the game appends extra bytes to a packet.
    let kind = buffer[0] // safe: all outbound kinds (0-9) are < 128, so first byte == kind in both raw and varint encoding
    if (kind === data.outPacketKinds.EXT_FOUND) {
        return null
    }
    if (kind === data.outPacketKinds.SPAWN) {
        initDone = true
        bot.spawned = false
        return buffer
    }
    if (kind === data.outPacketKinds.INPUT) {
        // When bot is active and the game is initialised, hand control to the AI.
        if (botActive && initDone) {
            try {
                return sendPackets(this, bot.getOutPackets())
            } catch (e) {
                console.log('[DiepBot] Bot error, deactivating:', e)
                botActive = false
                updateOverlay()
                return buffer
            }
        }
        // Otherwise pass the player's own input straight through untouched.
        return buffer
    }
    return buffer
}

// -----------------
// WS Injection.
var proxiedSend = inject(handleRecvData, handleSendData);