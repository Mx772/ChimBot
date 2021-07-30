// Chimy Boi
const config = require('./config.json')
const discord = require('discord.js');
const client = new discord.Client();
client.login(config.discord.token);


var chimTrain = {
    list: [],
    active: false,
    host: '',
    position: 0,
    message: null
}

var desc = {
    restart: `?chimstart - This will start a chim list with the host being the initiating user.\n`,
    vote: `?chimtransfer <@user> - This will transfer the host. Transfering Perms as well.`
}

client.on('ready', () => {
    console.log(`logged in as ${client.user.tag}!`);
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    client.user.setActivity(`Type ?chimhelp for Help!`);
});

const adminRole = config.discord.adminRoles
const channel = config.discord.channel
var cmdPrefix = config.discord.prefix

const cmdRegex = /(chim\w*)$/
const paramCmdRegex = /(chim\w*) (.\w+)/
const paramMention = /(chim\w*) <@!(\w+)/

client.on('message', async function (msg) {
    let match
    if (!msg.author.bot && (channel.includes(msg.channel.id)) && (msg.content.startsWith(cmdPrefix))) {
        message = msg.content
        console.log(message)

        // Command Parsing
        match = message.match(cmdRegex)
        let cmd = {
            command: null,
            param: null,
            user: null
        }

        if (match) {
            console.log(`Matches command ${match[1]}`)
            cmd.command = match[1]
        }
        match = message.match(paramCmdRegex)
        if (match) {
            console.log(`Matches Param Command ${match[1]} Param: ${match[2]}`)
            cmd.command = match[1]
            cmd.param = match[2]
        }
        match = message.match(paramMention)
        if (match) {
            console.log(`Matches Param Command with mention of user ${match[1]} Param: ${match[2]}`)
            cmd.command = match[1]
            cmd.user = match[2]
        }
        console.log(cmd)

        // Command Routing
        let output
        switch (cmd.command) {
            case 'chimhelp':
                console.log(`Sending Chim Help!`)
                output = "```" + Object.values(desc) + "```"
                output = output.replace(/,/g, '')
                msg.channel.send(output)
                break;
            case 'chimstart':
                if (chimTrain.active === false) {
                    resetTrain()
                    chimTrain.host = msg.author
                    chimTrain.active = true
                    let output = buildEmbed(chimTrain)
                    let postedMessage = await msg.channel.send({
                        embed: output
                    })
                    chimTrain.message = postedMessage
                    postedMessage.react('🚂')
                    postedMessage.react('⤴')
                    postedMessage.react('✅')
                    postedMessage.react('↩')
                    postedMessage.react('🛑')
                } else {
                    msg.channel.send(`There is already a ChimTrain going!!`)
                }

                break;
            case 'chimtransfer':
                if (chimTrain.active === false) {
                    console.log('No Chimtrain to Transfer!')
                    msg.channel.send('No ChimTrain to Transfer!')
                } else {
                    let userObj = await lookupUser(msg, cmd.user)
                    chimTrain.host = userObj.user
                    await chimTrain.message.edit(updateEmbed(chimTrain.message.embeds[0]))
                }
                break;
            default:
                msg.channel.send(`No matches for this command. Please enter ${cmdPrefix}chimhelp for help!`)
                break;
        }
    }
})

client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            return;
        }
    }
    if (reaction.me == false) {
        console.log(reaction.emoji.name)
        let userRoles = await lookupRoles(reaction.message, user)
        console.log(userRoles)
        let hasPerm = adminRole.some(role => userRoles.includes(role))
        switch (reaction.emoji.name) {
            case '🚂':
                await newMember(reaction.message, user.username)
                break;
            case '⤴':
                await dropMember(reaction.message, user.username)
                await removeReaction(reaction, user)
                break;
            case '✅':
                if (chimTrain.host.id === user.id || hasPerm) {
                    await nextMember(reaction.message)
                }
                await removeReaction(reaction, user)
                break;
            case '↩':
                if (chimTrain.host.id === user.id || hasPerm) {
                    await skipMember(reaction.message)
                }
                await removeReaction(reaction, user)
                break;
            case '🛑':
                if (chimTrain.host.id === user.id || hasPerm) {
                    await stopTrain(reaction.message)
                }
                break;
            default:
                console.log(`Not a valid emoji Choice ${reaction.emoji.name}`)
                break;
        }

    } else {
        console.log('Bot User')
    }
})

async function newMember(message, name) {
    let embed = message.embeds[0]
    let list = embed.fields[0]
    if (list.value == 'Nobody :(') {
        console.log('No body in list, adding first user....')
        chimTrain.list.push(name)
        embed.fields[0].value = chimTrain.list
        await message.edit(updateEmbed(embed))
    } else {
        if (!chimTrain.list.includes(name)) {
            console.log('Adding New User to list!')
            chimTrain.list.push(name)
            embed.fields[0].value = chimTrain.list
            await message.edit(updateEmbed(embed))
        } else {
            console.log('Member already on list.')
        }

    }
}

async function dropMember(message, name) {
    let embed = message.embeds[0]
    let list = embed.fields[0]
    let inList = chimTrain.list.includes(name)
    console.log(chimTrain.list)
    if (list.value == 'Nobody :(') {
        console.log('No body in list. Nobody to drop?')

    } else if (inList) {
        console.log(`Found user in List. Removing from list!`)
        let newList = chimTrain.list.filter(user => user !== name)
        chimTrain.list = newList
        if (chimTrain.list.length == 0) {
            embed.fields[0].value = 'Nobody :('
        } else {
            embed.fields[0].value = chimTrain.list
        }
        await message.edit(updateEmbed(embed))
    } else {
        console.log('Could not find user in list!')
    }
}

async function nextMember(message, name) {
    let embed = message.embeds[0]
    console.log('Next Member!')
    if (embed.fields[0].value == 'Nobody :(') {
        console.log('Nobody to next to!')
    } else {
        chimTrain.list[chimTrain.position] = `~~${chimTrain.list[chimTrain.position]}~~`
        chimTrain.position++
        if (chimTrain.list[chimTrain.position] == null) {
            console.log('Nobody to next to! Stoping Train!')
            embed.fields[0].value = chimTrain.list
            await stopTrain(message)
        } else {
            embed.fields[0].value = chimTrain.list
            await message.edit(updateEmbed(embed))
        }
    }
}

async function skipMember(message, name) {
    let embed = message.embeds[0]
    console.log('Skipping Member!')
    if (embed.fields[0].value == 'Nobody :(') {
        console.log('Nobody to next to!')
    } else {
        chimTrain.list[chimTrain.position] = `*${chimTrain.list[chimTrain.position]}*`
        chimTrain.position++
        if (chimTrain.list[chimTrain.position] == null) {
            console.log('Nobody to next to! Stoping Train!')
            embed.fields[0].value = chimTrain.list
            await stopTrain(message)
        } else {
            embed.fields[0].value = chimTrain.list
            await message.edit(updateEmbed(embed))
        }
    }
}

async function lookupRoles(message, user) {
    let guildMembers = message.guild.members.cache
    let userObj = await guildMembers.get(user.id)
    return userObj._roles
}

async function lookupUser(message, user) {
    let guildMembers = message.guild.members.cache
    let userObj = await guildMembers.get(user)
    return userObj
}

function buildEmbed(input) {
    let list
    console.log(input.list.length)
    if (input.list.length == 0) {
        list = 'Nobody :('
    } else {
        list = input.list
    }
    var embed = {
        "title": "CHOO CHOO Chim Train Starting!!!",
        "description": "Please React with 🚂 to join the Train!\n ⤴ to Hop off!",
        "url": "https://www.youtube.com/watch?v=D53M1vVF2N4&t=7s",
        "color": 5034862,
        "thumbnail": {
            "url": "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        // "image": {
        //     "url": "https://cdn.discordapp.com/embed/avatars/0.png"
        // },
        "author": {
            "name": "ChimBot",
            "url": "https://discordapp.com",
            "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        "fields": [{
                "name": "Chim List:",
                "value": `${list}`
            },
            {
                "name": "Host Commands",
                "value": "↩ - Skip User in line\n🛑 - Stop the train\n✅ - Next Member in line"
            },
            {
                "name": "Host:",
                "value": `${input.host}`,
                "inline": true
            },
            {
                "name": "Stats:",
                "value": `0/0`,
                "inline": true
            },
            {
                "name": "Currently up:",
                "value": `NAME`,
                "inline": true
            }
        ]
    }
    return embed
}

async function stopTrain(message) {
    let embed = message.embeds[0]
    console.log('Stopping the train!!')
    embed.title = `Train Completed!`
    await message.edit(updateEmbed(embed))
    resetTrain()
}

function updateEmbed(embed) {
    embed.fields[4].value = chimTrain.list[chimTrain.position]
    if (embed.fields[4].value == null) {
        embed.fields[4].value = 'List Complete!'
    }
    embed.fields[2].value = chimTrain.host
    embed.fields[3].value = `${chimTrain.position}/${chimTrain.list.length}`
    return embed
}

function resetTrain() {
    chimTrain.host = ''
    chimTrain.list = []
    chimTrain.position = 0
    chimTrain.active = false
}

async function removeReaction(reactionObj, user) {
    let reactions = reactionObj.message.reactions.cache
    reactions.forEach(reaction => {
        if (reaction.count > 1) {
            reaction.users.remove(user.id)
        }
    })
}