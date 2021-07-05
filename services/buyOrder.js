const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Retrieves the user's buy orders
 * @param {User} user 
 * @returns 
 */
exports.retrieveUserWithBuyOrders = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            buyOrders: {
                include : {
                    buyOrderStatus: true
                }
            }
        }
    })
}

/**
 * Find the db entry with the correct id
 * @param {Id} buyOrderId 
 * @returns 
 */
exports.find = (buyOrderId) => {
    return prisma.buyOrder.findUnique({
        where: {
            id : parseInt(buyOrderId)
        }
    })
}

/**
 * Updates a db entry
 * @param {Id} buyOrderId 
 * @returns 
 */
exports.update = (fields) => {
    return prisma.buyOrder.update({
        where: {
            id: parseInt(fields.buyOrder),
        },
        data: {
            label: fields.label,
            address: fields.address,
            pairAddress: fields.pairAddress,
            slippage: parseInt(fields.slippage),
            amountGiven:parseFloat(fields.amountGiven),
            autoMultiplier : parseFloat(fields.autoMultiplier),
            maxTime: parseInt(fields.maxTime)
        },
    })
}
