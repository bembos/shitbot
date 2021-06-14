const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Creates a bot for a user
 * @param {User} user 
 */
exports.createGeneralContraintsForUser = (user) => {
    return prisma.generalConstraints.create({
        data : {
            marketCap : false,
            maxCap : 0,
            minCap : 0,
            liqudity: false,
            maxLiq : 0,
            minLiq: 0,
            ownerRenounced: false,
            userId: user.id,
            constraintTypeId: 1
        }
    })
}

/**
 * Updates General constraint table entry
 * @param {Request params} req 
 * @param {Id of bot to update} constraintId 
 * @returns 
 */
exports.updateGeneralConstraints = (req, constraintId) => {
    return prisma.generalConstraints.update({
        where : {
            id: parseInt(constraintId)
        },
        data : {
            marketCap : req.marketCap ? true : false,
            maxCap : req.maxCap,
            minCap : req.minCap,
            liqudity: req.liqudity ? true : false,
            maxLiq : req.maxLiq,
            minLiq: req.minLiq,
            ownerRenounced: req.ownerRenounced ? true : false,
        }
    })
}

/**
 * Retrieves the user's bot
 * @param {User} user 
 * @returns 
 */
exports.retrieveUserWithGeneralConstraints = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            generalConstraints: true
        }
    })
}