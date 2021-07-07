const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Retrieves the user's bot
 * @param {User} user 
 * @returns 
 */
 exports.createDefault = (fields) => {
    return prisma.buyOrderConfiguration.create({
        data : {
            slippage : 49,
            amountGiven : 0.01,
            autoMultiplier : 2,
            maxTime : 90,
            timeBeforeBuy: 0,
            gasfees : 10,
            userId: fields.user
        }
    })
}

exports.retrieveWithConfiguration = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            buyOrderConfiguration: true
        }
    })
}

/**
 * Updates a bot model
 * @param {Request params} req 
 * @param {Id of Configuration} configuration id 
 * @returns 
 */
exports.updateConfiguration = (fields) => {
    return prisma.buyOrderConfiguration.update({
        where : {
            id: parseInt(fields.configuration)
        },
        data : {
            slippage : parseFloat(fields.slippage),
            amountGiven : parseFloat(fields.amountGiven),
            autoMultiplier : parseInt(fields.autoMultiplier),
            maxTime : parseInt(fields.maxTime),
            timeBeforeBuy: parseInt(fields.timeBeforeBuy),
            gasfees : parseInt(fields.gasfees)
        }
    })
}
