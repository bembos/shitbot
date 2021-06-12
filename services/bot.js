const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Creates a bot for a user
 * @param {User} user 
 */
exports.createBotFor = (user) => {
    return prisma.bot.create({
        data : {
            enabled : false,
            initialAmount : 0.01,
            autoMultiplier : 2,
            maxTransaction : 5,
            maxTime: 600,
            wallet: '-',
            userId: user.id
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