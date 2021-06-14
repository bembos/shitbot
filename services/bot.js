const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Creates a bot for a user
 * @param {User} user 
 */
exports.createBotForUser = (user) => {
    return prisma.bot.create({
        data : {
            enabled : false,
            initialAmount : 0.01,
            autoMultiplier : 2,
            slippage: 13,
            maxTransaction : 5,
            maxTime: 600,
            wallet: '-',
            userId: user.id
        }
    })
}

/**
 * Updates a bot model
 * @param {Request params} req 
 * @param {Id of bot to update} botId 
 * @returns 
 */
exports.updateBot = (req, botId) => {
    return prisma.bot.update({
        where : {
            id: parseInt(botId)
        },
        data : {
            initialAmount : parseFloat(req.body.initialAmount),
            autoMultiplier : parseFloat(req.body.autoMultiplier),
            slippage : parseInt(req.body.slippage),
            maxTransaction : parseInt(req.body.maxTransaction),
            maxTime: parseInt(req.body.maxTime),
            wallet: req.body.wallet
        }
    })
}

/**
 * Retrieves the user's bot
 * @param {User} user 
 * @returns 
 */
exports.retrieveUserWithBot = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            bot: true
        }
    })
}