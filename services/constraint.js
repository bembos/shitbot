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
            liquidity: false,
            maxLiq : 0,
            minLiq: 0,
            timeBased : false,
            timeForChecks: 0,
            ownerRenounced : false,
            maxLiqTokInAddress : 0,
            maxTokInAddress : 0,
            minNumberOfTxs : 0,
            minNumberOfHolders: 0,
            userId: user.id
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
            marketCap : req.body.marketCap ? true : false,
            maxCap : parseInt(req.body.maxCap),
            minCap : parseInt(req.body.minCap),
            liquidity: req.body.liquidity ? true : false,
            maxLiq : parseInt(req.body.maxLiq),
            minLiq: parseInt(req.body.minLiq),
            timeBased : req.body.timeBased ? true : false,
            timeForChecks: parseInt(req.body.timeForChecks),
            ownerRenounced : req.body.ownerRenounced ? true : false,
            maxLiqTokInAddress : parseInt(req.body.maxLiqTokInAddress),
            maxTokInAddress : parseInt(req.body.maxTokInAddress),
            minNumberOfTxs : parseInt(req.body.minNumberOfTxs),
            minNumberOfHolders: parseInt(req.body.minNumberOfHolders),
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