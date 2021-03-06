const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Retrieves the user's trade windows
 * @param {User} user 
 * @returns 
 */
exports.retrieveUserWithTradeWindows = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            bot: {
                include: {
                    tradeWindows : true
                }
            }
        }
    })
}

/**
 * Returns trade window object with log messages
 * @param {Id} tradeWindow 
 * @returns 
 */
exports.retrieveTradeWindowWithLogs = (tradeWindow) => {
    return prisma.tradeWindow.findUnique({
        where : {
            id: parseInt(tradeWindow)
        },
        include: {
            logMessages: true
        }
    })
}

/**
 * Retrieve trade window with transactions
 * @param {id} tradeWindow 
 * @returns 
 */
exports.retrieveTradeWindowWithTransactions = (tradeWindow) => {
    return prisma.tradeWindow.findUnique({
        where : {
            id: parseInt(tradeWindow)
        },
        include: {
            transactions: {
                include: {
                    transactionStatus: true
                }
            }
        }
    })
}

/**
 * 
 * @param {fields to create trade window with} fields 
 * @returns 
 */
exports.create = (fields) => {
    return prisma.tradeWindow.create({
        data : {
            tokenAddress : fields.tokenAddress,
            tokenName : fields.tokenName,
            botId : fields.botId
        }
    })
}
