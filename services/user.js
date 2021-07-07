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
            walletAddress: '-',
            walletPrivate: '-',
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
exports.updateUser = (req, botId) => {
    return prisma.bot.update({
        where : {
            id: parseInt(botId)
        },
        data : {
            walletAddress: req.body.walletAddress,
            walletPrivate: req.body.walletPrivate
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