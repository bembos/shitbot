const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Retrieves the user's code constraints
 * @param {User} user 
 * @returns 
 */
exports.retrieveUserWithCodeConstraints = (user) => {
    return prisma.user.findUnique({
        where : {
            id: user.id
        },
        include: {
            contractCodeConstaints: true
        }
    })
}

/**
 * Creates a db entry
 * @param {Data} req 
 * @returns 
 */
exports.create = (req) => {
    return prisma.userContractCodeCons.create({
        data: {
            label: req.body.label,
            desc: req.body.label,
            sourceCode: req.body.sourceCode,
            avoid: req.body.avoid ? true: false,
            userId: parseInt(req.body.userId),
            contractCodeConstraintId: 1
        }
    })
}

/**
 * Find the db entry with the correct id
 * @param {Id} constraintId 
 * @returns 
 */
exports.find = (constraintId) => {
    return prisma.userContractCodeCons.findUnique({
        where: {
            id : parseInt(constraintId)
        }
    })
}

/**
 * Finds the constraint and updates it with the given info
 * @param {Id} constraintId 
 * @returns 
 */
exports.update = (req) => {
    return prisma.userContractCodeCons.update({
        where: {
            id: parseInt(req.body.constraintId),
        },
        data: {
            label: req.body.label,
            desc: req.body.desc,
            sourceCode: req.body.sourceCode,
            avoid: req.body.avoid ? true: false
        },
    })
}

/**
 * Deletes the constraint with the given id
 * @param {Id} constraintId 
 * @returns 
 */
exports.delete = (constraintId) => {
    return prisma.userContractCodeCons.delete({
        where: {
            id: parseInt(constraintId),
        },
    })
}
