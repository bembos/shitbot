const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * 
 * @param {fields to create log message with} fields 
 * @returns 
 */
exports.create = (fields) => {
    return prisma.buyOrderLogMessage.create({
        data : {
            content : fields.content,
            buyOrderId : fields.buyOrderId,
        }
    })
}
