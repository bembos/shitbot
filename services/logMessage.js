const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * 
 * @param {fields to create log message with} fields 
 * @returns 
 */
exports.create = (fields) => {
    return prisma.logMessage.create({
        data : {
            content : fields.content,
            tradeWindowId : fields.tradeWindowId,
        }
    })
}
