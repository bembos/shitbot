const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Retrieves the user's buy orders
 * @param {User} user 
 * @returns 
 */
exports.retrieveUserWithBuyOrdersAndConf = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            buyOrders: {
                include : {
                    buyOrderStatus: true
                }
            },
            buyOrderConfiguration : true
        }
    })
}

/**
 * Returns a buy order with its logs
 * @param {Id} buyOrderId 
 * @returns 
 */
exports.retrieveBuyOrderWithlogs = (buyOrderId) => {
    return prisma.buyOrder.findUnique({
        where : {
            id: parseInt(buyOrderId)
        },
        include: {
            logMessages : true,
            buyOrderStatus : true
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
            maxTime: parseInt(fields.maxTime),
            buyOrderStatusId: parseInt(fields.buyOrderStatusId),
            timeBeforeBuy: parseInt(fields.timeBeforeBuy),
            gasfees : parseInt(fields.gasfees)
        },
    })
}
